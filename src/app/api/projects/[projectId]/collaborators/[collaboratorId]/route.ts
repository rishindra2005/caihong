import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';

// DELETE - Remove a collaborator from a project
export async function DELETE(
  request: Request,
  { params }: { params: { projectId: string; collaboratorId: string } }
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
      owner: session.user.id // Only owner can remove collaborators
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or you are not the owner' }, { status: 404 });
    }

    // Check if collaborator exists in the project
    const collaboratorIndex = project.collaborators.findIndex(
      (id: mongoose.Types.ObjectId) => id.toString() === params.collaboratorId
    );

    if (collaboratorIndex === -1) {
      return NextResponse.json({ error: 'Collaborator not found in this project' }, { status: 404 });
    }

    // Remove the collaborator
    project.collaborators.splice(collaboratorIndex, 1);
    await project.save();

    return NextResponse.json({ message: 'Collaborator removed successfully' });
  } catch (error) {
    console.error('Error removing collaborator:', error);
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
  }
} 