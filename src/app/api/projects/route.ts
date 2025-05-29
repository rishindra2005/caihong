import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import User from '@/lib/db/models/User';
import fs from 'fs/promises';
import path from 'path';
import { initializeGit } from '@/lib/utils/gitUtils';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    // Make sure User model is registered before using populate
    if (!mongoose.models.User) {
      mongoose.model('User', User.schema);
    }
    
    const [owned, collaborations] = await Promise.all([
      Project.find({ owner: session.user.id })
        .populate('owner', 'name email image')
        .lean()
        .exec(),
      Project.find({ collaborators: session.user.id })
        .populate('owner', 'name email image')
        .lean()
        .exec()
    ]);

    return NextResponse.json({
      owned: owned || [],
      collaborations: collaborations || []
    });
  } catch (error) {
    console.error('Projects fetch error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch projects'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    const { name, description } = await request.json();
    
    // Create project in database first
    const project = await Project.create({
      name,
      description,
      owner: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create project directory
    const projectPath = path.join(process.env.PROJECT_PATH!, project._id.toString());
    await fs.mkdir(projectPath, { recursive: true });

    // Update project with path
    project.projectPath = project._id.toString();
    await project.save();

    // Initialize Git repository if Git is enabled in project settings
    const gitEnabled = project.settings.get('gitEnabled') !== false;
    if (gitEnabled) {
      try {
        await initializeGit(projectPath);
      } catch (gitError) {
        console.error('Git initialization error:', gitError);
        // Continue even if Git initialization fails
      }
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Project creation error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create project' 
    }, { status: 500 });
  }
}
