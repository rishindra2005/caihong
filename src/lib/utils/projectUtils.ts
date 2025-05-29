import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import path from 'path';

/**
 * Verify user has access to a project and return the project path
 * @param userId User ID to check access for
 * @param projectId Project ID to check
 * @returns Project file system path if access is granted, null otherwise
 */
export async function verifyProjectAccess(userId: string, projectId: string): Promise<string | null> {
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    // Find project where user is owner or collaborator
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: userId },
        { collaborators: userId }
      ]
    });
    
    // Return null if project not found or user doesn't have access
    if (!project) {
      return null;
    }
    
    // Return the project's file system path
    return path.join(process.env.PROJECT_PATH!, project.projectPath);
  } catch (error) {
    console.error('Error verifying project access:', error);
    return null;
  }
} 