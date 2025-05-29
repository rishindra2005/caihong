'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon, PencilIcon, UserGroupIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import ShareDialog from '@/components/projects/ShareDialog';
import EditProjectDialog from '@/components/projects/EditProjectDialog';

interface Project {
  _id: string;
  name: string;
  description: string;
  owner: {
    _id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ProjectList({ userId }: { userId: string }) {
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [leavingProjectId, setLeavingProjectId] = useState<string | null>(null);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [projectToLeave, setProjectToLeave] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Fetched projects:', data); // Debug log
      
      if (data.owned || data.collaborations) {
        setOwnedProjects(data.owned || []);
        setSharedProjects(data.collaborations || []);
      } else {
        console.error('Unexpected data structure:', data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setOwnedProjects([]);
      setSharedProjects([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (data: { name: string; description: string }) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create project');
      await fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setIsEditDialogOpen(true);
  };

  const handleShareClick = (project: Project) => {
    setSelectedProject(project);
    setIsShareDialogOpen(true);
  };

  const handleLeaveProject = async (projectId: string) => {
    try {
      setLeavingProjectId(projectId);
      const response = await fetch(`/api/projects/${projectId}/collaborators/me`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects();
        setIsLeaveDialogOpen(false);
        setProjectToLeave(null);
      } else {
        console.error('Failed to leave project');
      }
    } catch (error) {
      console.error('Error leaving project:', error);
    } finally {
      setLeavingProjectId(null);
    }
  };

  const confirmLeaveProject = (project: Project) => {
    setProjectToLeave(project);
    setIsLeaveDialogOpen(true);
  };

  const renderProjectCard = (project: Project, isOwned: boolean) => (
    <div
      key={project._id}
      className="group relative p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow">
          {!isOwned && (
            <div className="flex items-center gap-2 mb-2">
              {project.owner.image ? (
                <img
                  src={project.owner.image}
                  alt={project.owner.name}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <UserCircleIcon className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Owned by <span className="font-medium text-gray-900 dark:text-white">{project.owner.name}</span>
              </span>
            </div>
          )}
          <Link
            href={`/projects/${project._id}`}
            className="block"
            prefetch={false}
          >
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {project.name}
            </h3>
          </Link>
        </div>
        {isOwned ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleShareClick(project)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <UserGroupIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleEditClick(project)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => confirmLeaveProject(project)}
            disabled={leavingProjectId === project._id}
            className="text-xs px-3 py-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {leavingProjectId === project._id ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Leaving...
              </>
            ) : (
              'Leave Project'
            )}
          </button>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {project.description}
      </p>
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p>
          Created: <span className="font-medium">{formatDate(project.createdAt)}</span>
        </p>
        <p>
          Last updated: <span className="font-medium">{formatDate(project.updatedAt)}</span>
        </p>
      </div>
    </div>
  );

  const renderProjectSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-grow">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mt-2"></div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderProjectSection = (title: string, projects: Project[], isOwned: boolean) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isOwned ? 'Projects you created' : 'Projects shared with you'}
          </p>
        </div>
        {isOwned && (
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <PlusIcon className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>
      {isLoading ? (
        renderProjectSkeleton()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => renderProjectCard(project, isOwned))}
          {projects.length === 0 && !isLoading && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {isOwned ? "You don't have any projects yet" : "No projects have been shared with you"}
              </p>
              {isOwned && (
                <button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Create your first project
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {renderProjectSection("Your Projects", ownedProjects, true)}
      {renderProjectSection("Shared with You", sharedProjects, false)}

      <Dialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md transform transition-all">
            <Dialog.Title className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create New Project
            </Dialog.Title>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await handleCreateProject({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
              });
              setIsCreateDialogOpen(false);
            }}>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 transition-colors"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 transition-colors"
                    placeholder="Enter project description"
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Create Project
                  </button>
                </div>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {selectedProject && (
        <>
          <ShareDialog
            projectId={selectedProject._id}
            isOpen={isShareDialogOpen}
            onClose={() => {
              setIsShareDialogOpen(false);
              setSelectedProject(null);
            }}
          />
          <EditProjectDialog
            projectId={selectedProject._id}
            initialName={selectedProject.name}
            initialDescription={selectedProject.description}
            isOpen={isEditDialogOpen}
            onClose={() => {
              setIsEditDialogOpen(false);
              setSelectedProject(null);
            }}
            onUpdate={fetchProjects}
          />
        </>
      )}

      <Dialog
        open={isLeaveDialogOpen}
        onClose={() => setIsLeaveDialogOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md transform transition-all">
            <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
              Leave Project
            </Dialog.Title>
            <div className="mt-4">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Are you sure you want to leave "{projectToLeave?.name}"?
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Note: Once you leave, you won't be able to access this project again unless the owner adds you back as a collaborator.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLeaveDialogOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => projectToLeave && handleLeaveProject(projectToLeave._id)}
                  disabled={leavingProjectId !== null}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {leavingProjectId ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Leaving...
                    </>
                  ) : (
                    'Leave Project'
                  )}
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}