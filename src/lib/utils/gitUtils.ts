import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Initialize Git repository if it doesn't exist
 * @param projectPath Path to the project root
 * @param userName Optional user name for commit author
 * @param userEmail Optional user email for commit author
 * @returns Boolean indicating if initialization was successful or already exists
 */
export async function initializeGit(
  projectPath: string,
  userName: string = 'User',
  userEmail: string = 'user@example.com'
): Promise<boolean> {
  try {
    // Check if git is already initialized
    if (fs.existsSync(path.join(projectPath, '.git'))) {
      return true;
    }

    // Initialize git repository
    execSync('git init', { cwd: projectPath });
    
    // Create .gitignore file
    const gitignoreContent = `
# Node.js
node_modules/
npm-debug.log
yarn-error.log
yarn-debug.log
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/sdks
!.yarn/versions

# Build outputs
/dist
/build
/.next/
/out/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Editor directories and files
.idea/
.vscode/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db
`;
    
    fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignoreContent.trim());
    
    // Initial commit
    execSync('git add .', { cwd: projectPath });
    execSync(`git config --local user.email "${userEmail}"`, { cwd: projectPath });
    execSync(`git config --local user.name "${userName}"`, { cwd: projectPath });
    execSync('git commit -m "Initial commit"', { cwd: projectPath });
    
    return true;
  } catch (error) {
    console.error('Error initializing git repository:', error);
    return false;
  }
}

/**
 * Get Git status for a project
 * @param projectPath Path to the project root
 * @returns Object with changes status and modified files
 */
export async function getGitStatus(projectPath: string): Promise<{
  hasChanges: boolean;
  modifiedFiles: string[];
}> {
  try {
    if (!fs.existsSync(path.join(projectPath, '.git'))) {
      return { hasChanges: false, modifiedFiles: [] };
    }
    
    const status = execSync('git status --porcelain', { 
      cwd: projectPath, 
      encoding: 'utf-8' 
    });
    
    const modifiedFiles = status
      .split('\n')
      .filter(line => line.trim() !== '')
      .map(line => line.substring(3));
    
    return {
      hasChanges: modifiedFiles.length > 0,
      modifiedFiles
    };
  } catch (error) {
    console.error('Error checking git status:', error);
    return { hasChanges: false, modifiedFiles: [] };
  }
}

/**
 * Commit changes to Git repository
 * @param projectPath Path to the project root
 * @param message Commit message
 * @param userName Optional user name for commit author
 * @param userEmail Optional user email for commit author
 * @returns Boolean indicating if commit was successful
 */
export async function commitChanges(
  projectPath: string, 
  message: string = 'Auto-commit changes',
  userName?: string,
  userEmail?: string
): Promise<boolean> {
  try {
    if (!fs.existsSync(path.join(projectPath, '.git'))) {
      await initializeGit(projectPath, userName, userEmail);
    } else if (userName && userEmail) {
      // Update git config if user info is provided
      execSync(`git config --local user.email "${userEmail}"`, { cwd: projectPath });
      execSync(`git config --local user.name "${userName}"`, { cwd: projectPath });
    }
    
    const { hasChanges } = await getGitStatus(projectPath);
    if (!hasChanges) {
      return false; // No changes to commit
    }
    
    execSync('git add .', { cwd: projectPath });
    execSync(`git commit -m "${message}"`, { cwd: projectPath });
    return true;
  } catch (error) {
    console.error('Error committing changes:', error);
    return false;
  }
}

/**
 * Get Git commit history for a project
 * @param projectPath Path to the project root
 * @returns Array of commit information
 */
export async function getCommitHistory(projectPath: string): Promise<Array<{
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}>> {
  try {
    if (!fs.existsSync(path.join(projectPath, '.git'))) {
      return [];
    }
    
    // Get commit log with hash, author, date, and message
    const log = execSync(
      'git log --pretty=format:"%H|%h|%an|%ad|%s" --date=iso', 
      { cwd: projectPath, encoding: 'utf-8' }
    );
    
    const commits = log.split('\n').map(line => {
      const [hash, shortHash, author, date, message] = line.split('|');
      
      // Get files changed in this commit
      const filesChanged = execSync(
        `git show --name-only --oneline ${hash} | tail -n +2`,
        { cwd: projectPath, encoding: 'utf-8' }
      ).split('\n').filter(file => file.trim() !== '');
      
      return {
        hash,
        shortHash,
        author,
        date,
        message,
        files: filesChanged
      };
    });
    
    return commits;
  } catch (error) {
    console.error('Error getting commit history:', error);
    return [];
  }
}

/**
 * Get diff for a specific file between two commits
 * @param projectPath Path to the project root
 * @param filePath Path to the file relative to project root
 * @param commitHash Commit hash to compare with (defaults to HEAD)
 * @param prevCommitHash Previous commit hash to compare against (defaults to previous commit)
 * @returns Diff content as string
 */
export async function getFileDiff(
  projectPath: string,
  filePath: string,
  commitHash: string = 'HEAD',
  prevCommitHash: string = ''
): Promise<string> {
  try {
    if (!fs.existsSync(path.join(projectPath, '.git'))) {
      return '';
    }
    
    const diffCommand = prevCommitHash
      ? `git diff ${prevCommitHash} ${commitHash} -- "${filePath}"`
      : `git diff ${commitHash}^ ${commitHash} -- "${filePath}"`;
    
    return execSync(diffCommand, { 
      cwd: projectPath, 
      encoding: 'utf-8' 
    });
  } catch (error) {
    console.error('Error getting file diff:', error);
    return '';
  }
} 