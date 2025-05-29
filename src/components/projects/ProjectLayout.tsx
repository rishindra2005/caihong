'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import ResizablePanel from '@/components/layout/ResizablePanel';
import FileExplorer from '@/components/files/FileExplorer';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';
import ShareDialog from './ShareDialog';

const MonacoEditor = dynamic(() => import('@/components/editor/MonacoEditor'), {
  ssr: false
});

interface File {
  _id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  owner: string;
}

interface ProjectLayoutProps {
  project: {
    _id: string;
    name: string;
    owner: string;
  };
  files: File[];
}

export default function ProjectLayout({ project, files }: ProjectLayoutProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === 'file') {
      setSelectedFile(file);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <div className="flex items-center justify-between p-4 border-b w-full">
        <h1 className="text-xl font-bold">{project.name}</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Compile</button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded">Download</button>
          <button 
            onClick={() => setIsShareDialogOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Share
          </button>
        </div>
      </div>

      <div className="flex w-full h-[calc(100%-4rem)]">
        <div className="w-64 border-r">
          <FileExplorer 
            projectId={project._id}
            initialFiles={files}
            onFileSelect={handleFileSelect}
          />
        </div>
        
        <div className="flex-1">
          <ResizablePanel direction="horizontal" defaultSizes={[60, 40]}>
            <div className="h-full">
              {selectedFile ? (
                <MonacoEditor
                  key={selectedFile._id}
                  initialValue={selectedFile.content || ''}
                  language="latex"
                  onChange={async (value) => {
                    // TODO: Implement file content update
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a file to edit
                </div>
              )}
            </div>
            <div className="h-full">
              {/* PDF viewer will go here */}
            </div>
          </ResizablePanel>
        </div>
      </div>

      <ShareDialog
        projectId={project._id}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
      />
    </div>
  );
}

export function ProjectList({ userId }: { userId: string }) {
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchProjects = async () => {
    const res = await fetch('/api/projects');
    const data = await res.json();
    setOwnedProjects(data.owned);
    setSharedProjects(data.collaborations);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const renderProjectGrid = (projects: Project[], type: 'owned' | 'shared') => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <Link
          key={project._id}
          href={`/projects/${project._id}`}
          className="block p-4 border rounded-lg hover:border-blue-500 transition-colors"
        >
          <h3 className="font-semibold">{project.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {project.description}
          </p>
          {type === 'shared' && (
            <p className="text-xs text-gray-500 mt-2">
              Shared with you
            </p>
          )}
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Your Projects</h2>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            New Project
          </button>
        </div>
        {renderProjectGrid(ownedProjects, 'owned')}
      </div>

      {sharedProjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-6">Shared with You</h2>
          {renderProjectGrid(sharedProjects, 'shared')}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        className="relative z-50"
      >
        {/* ... existing dialog code ... */}
      </Dialog>
    </div>
  );
}
