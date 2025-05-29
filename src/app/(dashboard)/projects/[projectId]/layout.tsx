import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import { redirect } from 'next/navigation';
import { AIProvider } from '@/components/ai/AIProvider';
import ProjectNavbar from '@/components/dashboard/ProjectNavbar';
import mongoose from 'mongoose';
import Project from '@/lib/db/models/Projects';

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
    project: project ? JSON.parse(JSON.stringify(project)) : null,
    user: session.user
  };
}

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const paramsCopy = await Promise.resolve(params);
  const projectId = paramsCopy.projectId;
  const data = await getProjectData(projectId);
  if (!data?.project) {
    redirect('/dashboard');
  }

  return (
    <>
      {/* Remove dashboard navbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-main-nav {
          display: none !important;
        }
        
        .dashboard-main-content {
          padding-top: 0 !important;
        }
      `}} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col h-full">
        <ProjectNavbar 
          user={session.user} 
          projectName={data.project.name}
          projectId={projectId}
          selectedFile={null}
          // Client-side functionality to be provided by dashboard
        />
        <AIProvider>
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </AIProvider>
      </div>
    </>
  );
} 