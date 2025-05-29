'use client';

import { useEffect } from 'react';
import ProjectDashboard from './ProjectDashboard';
import { ProjectSettings } from '../settings/ProjectSettings';

// Global state to hold references to project functionality
interface ProjectStateHandlers {
  updateProjectName: (newName: string) => Promise<void>;
  togglePanelPositions: () => void;
  openSettings: () => void;
  projectName: string;
  projectId: string;
  selectedFile: string | null;
  projectSettings?: ProjectSettings;
  updateProjectSettings?: (settings: ProjectSettings) => Promise<void>;
}

// Global variable to store the handlers
let globalProjectHandlers: ProjectStateHandlers | null = null;

// Function to set handlers (called by ProjectDashboard)
export function setProjectHandlers(handlers: ProjectStateHandlers | null) {
  globalProjectHandlers = handlers;
  
  // Dispatch an event to notify the navbar that handlers are available
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('project-handlers-updated', { detail: handlers });
    window.dispatchEvent(event);
  }
}

// Function to get handlers (called by ProjectNavbar)
export function getProjectHandlers(): ProjectStateHandlers | null {
  return globalProjectHandlers;
}

interface ProjectDashboardWrapperProps {
  projectId: string;
  initialPath?: string;
}

export default function ProjectDashboardWrapper({ projectId, initialPath }: ProjectDashboardWrapperProps) {
  // Add event listener for when the navbar mounts and requests handlers
  useEffect(() => {
    const handleNavbarRequest = () => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('project-handlers-updated', { detail: globalProjectHandlers });
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('navbar-mounted', handleNavbarRequest);
    return () => {
      window.removeEventListener('navbar-mounted', handleNavbarRequest);
    };
  }, []);

  return (
    <ProjectDashboard 
      projectId={projectId} 
      initialPath={initialPath} 
    />
  );
} 