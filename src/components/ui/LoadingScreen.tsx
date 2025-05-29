import React, { useEffect, useState } from 'react';
import { Spinner } from './Spinner';

// We'll define loading stages to show progress
export type LoadingStage = {
  id: string;
  label: string;
  completed: boolean;
};

interface LoadingScreenProps {
  text?: string;
  isVisible: boolean;
  loadingStages?: LoadingStage[];
  autoProgress?: boolean;
}

export function LoadingScreen({ 
  text = 'Loading your project...', 
  isVisible, 
  loadingStages: externalStages,
  autoProgress = true
}: LoadingScreenProps) {
  const [loadingStages, setLoadingStages] = useState<LoadingStage[]>(
    externalStages || [
      { id: 'files', label: 'Loading file structure...', completed: false },
      { id: 'project', label: 'Fetching project details...', completed: false },
      { id: 'settings', label: 'Applying your settings...', completed: false },
      { id: 'editor', label: 'Preparing editor...', completed: false },
    ]
  );
  
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Update internal stages when external stages change
  useEffect(() => {
    if (externalStages) {
      setLoadingStages(externalStages);
      
      // Calculate progress based on completed stages
      const completedCount = externalStages.filter(stage => stage.completed).length;
      setProgress(Math.min(100, (completedCount / externalStages.length) * 100));
      
      // Update current stage index to first incomplete stage
      const firstIncompleteIndex = externalStages.findIndex(stage => !stage.completed);
      if (firstIncompleteIndex !== -1) {
        setCurrentStageIndex(firstIncompleteIndex);
      } else {
        setCurrentStageIndex(externalStages.length);
      }
    }
  }, [externalStages]);
  
  // Auto-progress logic for demo/fallback
  useEffect(() => {
    if (!isVisible || !autoProgress || externalStages) return;
    
    // Simulate the loading process
    const stageInterval = setInterval(() => {
      setLoadingStages(prev => {
        if (currentStageIndex >= prev.length) {
          clearInterval(stageInterval);
          return prev;
        }
        
        const updated = [...prev];
        updated[currentStageIndex] = { 
          ...updated[currentStageIndex], 
          completed: true 
        };
        
        return updated;
      });
      
      setCurrentStageIndex(prev => {
        const next = prev + 1;
        setProgress(Math.min(100, (next / loadingStages.length) * 100));
        return next;
      });
      
    }, 700); // Each stage takes 700ms
    
    return () => clearInterval(stageInterval);
  }, [isVisible, currentStageIndex, loadingStages.length, autoProgress, externalStages]);

  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 z-50 flex flex-col items-center justify-center transition-all duration-300">
      <div className="flex flex-col items-center space-y-6 p-8 rounded-lg bg-white dark:bg-gray-800 shadow-xl max-w-md w-full">
        <div className="relative">
          <Spinner size="lg" className="text-blue-600 dark:text-blue-500" />
          <div className="absolute -inset-4 border-t-2 border-blue-500 rounded-full opacity-25 animate-ping"></div>
        </div>
        
        <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">{text}</h2>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Loading stages */}
        <div className="w-full space-y-3">
          {loadingStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              {stage.completed ? (
                <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : index === currentStageIndex ? (
                <Spinner size="sm" className="text-blue-500 mr-3" />
              ) : (
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full mr-3"></div>
              )}
              <span className={`text-sm ${
                stage.completed 
                  ? 'text-green-600 dark:text-green-400' 
                  : index === currentStageIndex
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
              }`}>
                {stage.label}
              </span>
            </div>
          ))}
        </div>
        
        <div className="flex space-x-1 mt-4">
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
} 