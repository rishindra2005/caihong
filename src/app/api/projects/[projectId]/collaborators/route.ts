import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import User from '@/lib/db/models/User';

// GET - Fetch all collaborators for a project
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Find the project and check authorization
    const project = await Project.findOne({
      _id: params.projectId,
      $or: [
        { owner: session.user.id },
        { collaborators: session.user.id }
      ]
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Only the owner can view collaborators
    if (project.owner.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only the project owner can view collaborators' }, { status: 403 });
    }

    // Fetch collaborator details
    const collaborators = await User.find(
      { _id: { $in: project.collaborators } },
      { name: 1, email: 1, image: 1 }
    );

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}

// POST - Add a collaborator to a project
export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }

    // Parse the request body
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the project and check authorization
    const project = await Project.findOne({
      _id: params.projectId,
      owner: session.user.id // Only owner can add collaborators
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Find the user to add as collaborator
    const collaborator = await User.findOne({ email });
    if (!collaborator) {
      return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
    }

    // Check if user is already the owner
    if (collaborator._id.toString() === project.owner.toString()) {
      return NextResponse.json({ error: 'You are already the owner of this project' }, { status: 400 });
    }

    // Check if user is already a collaborator
    if (project.collaborators.includes(collaborator._id)) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 });
    }

    // Add the collaborator to the project
    project.collaborators.push(collaborator._id);
    await project.save();

    return NextResponse.json({ 
      message: 'Collaborator added successfully',
      collaborator: {
        _id: collaborator._id,
        name: collaborator.name,
        email: collaborator.email,
        image: collaborator.image
      }
    });
  } catch (error) {
    console.error('Error adding collaborator:', error);
    return NextResponse.json({ error: 'Failed to add collaborator' }, { status: 500 });
  }
} 