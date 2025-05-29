import { NextResponse } from 'next/server';
import Project from '@/lib/db/models/Projects';
import mongoose from 'mongoose';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  try {
    const { projectId, storageLimit, password } = await request.json();

    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    const project = await Project.findByIdAndUpdate(
      projectId,
      { storageLimit },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      storageLimit: project.storageLimit,
      message: `Successfully updated storage limit for project ${projectId} to ${storageLimit} bytes`
    });
  } catch (error) {
    console.error('Error updating storage limit:', error);
    return NextResponse.json({ 
      error: 'Failed to update storage limit',
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
} 