import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';
import ProjectDashboard from '@/components/projects/ProjectDashboard';

async function getProjectData(projectId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  await mongoose.connect(process.env.MONGODB_URI!);
  const project = await Project.findOne({
    _id: projectId,
    $or: [
      { owner: session.user.id },
      { collaborators: session.user.id }
    ]
  });

  return {
    project: project ? JSON.parse(JSON.stringify(project)) : null
  };
}

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string }
}) {
  // Await params before using its properties
  const paramsCopy = await Promise.resolve(params);
  const projectId = paramsCopy.projectId;
  const data = await getProjectData(projectId);
  
  if (!data?.project) {
    notFound();
  }

  return <ProjectDashboard projectId={projectId} />;
}
