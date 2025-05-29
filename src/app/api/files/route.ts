import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import File from '@/lib/db/models/File';
import Project from '@/lib/db/models/Projects';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;
    
    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Verify project ownership or collaboration access
    const project = await Project.findOne({
      _id: projectId,
      $or: [
        { owner: session.user.id },
        { collaborators: session.user.id }
      ]
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const file = await File.create({
      name: formData.get('name'),
      content: formData.get('content'),
      project: projectId,
      parent: formData.get('parentId') || null
    });

    return NextResponse.json(file);
  } catch (error) {
    console.error('File creation error:', error);
    return NextResponse.json({ error: 'Failed to create file' }, { status: 500 });
  }
} 