'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { HomeIcon, ArrowLeftIcon, CreditCardIcon, ArrowPathIcon, ArrowsRightLeftIcon, CogIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useRouter, useParams } from 'next/navigation';
import { getProjectHandlers } from '@/components/projects/ProjectDashboardWrapper';
import path from 'path';
import { toast } from 'react-hot-toast';
import { analyzeLatexCompilation } from '@/lib/utils/latexLogParser';

interface ProjectNavbarProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    credits: number;
  };
  projectName?: string;
  projectId?: string;
  selectedFile?: string | null;
}

export default function ProjectNavbar({ 
  user, 
  projectName, 
  projectId: propProjectId,
  selectedFile
}: ProjectNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const editNameRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  
  const projectId = propProjectId || (params?.projectId as string);

  const [projectHandlers, setProjectHandlers] = useState<any>(null);
  const [isCreditsPopoverOpen, setIsCreditsPopoverOpen] = useState(false);
  const [creditHistory, setCreditHistory] = useState<{id: string; amount: number; description: string; date: string; beforeBalance: number; afterBalance: number}[]>([]);
  const [isLoadingCreditHistory, setIsLoadingCreditHistory] = useState(false);
  const creditsRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileState, setCompileState] = useState<'idle' | 'compiling' | 'success' | 'partial' | 'failure' | 'timeout'>('idle');
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [lastCompileTime, setLastCompileTime] = useState<number | null>(null);
  const [isCompilationInProgress, setIsCompilationInProgress] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch credit history when credits popover opens
  useEffect(() => {
    if (isCreditsPopoverOpen) {
      fetchCreditHistory();
    }
  }, [isCreditsPopoverOpen]);

  // Function to fetch credit history
  const fetchCreditHistory = async () => {
    if (isLoadingCreditHistory) return;
    
    setIsLoadingCreditHistory(true);
    try {
      const response = await fetch('/api/credits/history?limit=4');
      if (!response.ok) {
        throw new Error('Failed to fetch credit history');
      }
      
      const data = await response.json();
      if (data.success && Array.isArray(data.history)) {
        setCreditHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching credit history:', error);
      // Fallback to sample data if API fails
      setCreditHistory([
        { id: '1', amount: -2, description: "Generated AI response", date: new Date(Date.now() - 3600000).toLocaleString(), beforeBalance: 102, afterBalance: 100 },
        { id: '2', amount: -1, description: "Code completion", date: new Date(Date.now() - 7200000).toLocaleString(), beforeBalance: 103, afterBalance: 102 },
        { id: '3', amount: 50, description: "Monthly credit refill", date: new Date(Date.now() - 86400000).toLocaleString(), beforeBalance: 53, afterBalance: 103 },
        { id: '4', amount: -5, description: "Project compilation", date: new Date(Date.now() - 172800000).toLocaleString(), beforeBalance: 58, afterBalance: 53 },
      ]);
    } finally {
      setIsLoadingCreditHistory(false);
    }
  };

  // Handle clicking outside the credits popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isCreditsPopoverOpen && creditsRef.current && !creditsRef.current.contains(event.target as Node)) {
        setIsCreditsPopoverOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCreditsPopoverOpen]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Handle hover to open with a slight delay
  const handleCreditsMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    if (!isCreditsPopoverOpen) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsCreditsPopoverOpen(true);
      }, 300); // 300ms delay before showing
    }
  };

  // Handle mouse leave with delay
  const handleCreditsMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      if (!creditsRef.current?.matches(':hover')) {
        setIsCreditsPopoverOpen(false);
      }
    }, 400); // 400ms delay before hiding
  };

  const refreshCredits = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      router.refresh();
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Request handlers when mounted
  useEffect(() => {
    // Dispatch event to notify wrapper we need handlers
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('navbar-mounted');
      window.dispatchEvent(event);
    }
    
    // Set handlers if already available
    const currentHandlers = getProjectHandlers();
    if (currentHandlers) {
      setProjectHandlers(currentHandlers);
      if (currentHandlers.projectName) {
        setEditedName(currentHandlers.projectName);
      }
    }
    
    // Listen for handler updates
    const handlersUpdated = (event: CustomEvent) => {
      if (event.detail) {
        setProjectHandlers(event.detail);
        if (event.detail.projectName) {
          setEditedName(event.detail.projectName);
        }
      }
    };
    
    // Listen for compilation completed events to update the time
    const handleCompilationCompleted = (event: CustomEvent) => {
      const { duration, status } = event.detail;
      
      if (duration) {
        setLastCompileTime(duration);
      }
      
      if (status) {
        setCompileState(status as 'success' | 'partial' | 'failure');
      }
      
      // Update PDF path if available
      if (event.detail.pdfPath) {
        setPdfPath(event.detail.pdfPath);
      }
    };
    
    // Handle compilation error event
    const handleCompilationError = (event: CustomEvent) => {
      setCompileState('failure');
      
      // Try to get duration from multiple possible locations in the error detail
      const errorDuration = 
        event.detail.duration || 
        (event.detail.details && event.detail.details.duration) ||
        (event.detail.data && event.detail.data.duration) ||
        (event.detail.response && event.detail.response.duration) ||
        null;
      
      // Still update the compile time if available
      if (errorDuration) {
        setLastCompileTime(errorDuration);
        console.log("Captured compilation time from error:", errorDuration);
      }
      
      // Update PDF path if available
      if (event.detail.pdfPath) {
        setPdfPath(event.detail.pdfPath);
      }
    };
    
    window.addEventListener('project-handlers-updated', handlersUpdated as EventListener);
    window.addEventListener('compilation-completed', handleCompilationCompleted as EventListener);
    window.addEventListener('compilation-error', handleCompilationError as EventListener);
    
    return () => {
      window.removeEventListener('project-handlers-updated', handlersUpdated as EventListener);
      window.removeEventListener('compilation-completed', handleCompilationCompleted as EventListener);
      window.removeEventListener('compilation-error', handleCompilationError as EventListener);
    };
  }, []);
  
  // Handle start editing
  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(projectHandlers?.projectName || projectName || '');
    setIsEditingName(true);
  };
  
  // Handle cancel editing
  const cancelEditing = () => {
    setIsEditingName(false);
  };

  // Handle save
  const handleSave = async () => {
    if (!editedName.trim() || !projectHandlers?.updateProjectName || editedName === projectHandlers.projectName) {
      setIsEditingName(false);
      return;
    }
    
    await projectHandlers.updateProjectName(editedName);
    setIsEditingName(false);
  };

  // Handle keyboard events for the edit input
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  // Setup click outside handler for name editing
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isEditingName && editNameRef.current && !editNameRef.current.contains(event.target as Node)) {
        cancelEditing();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditingName]);

  // Add a helper function to get file name from path
  const getFileName = (filePath: string | null | undefined) => {
    if (!filePath) return null;
    return filePath.split('/').pop();
  };

  const currentFile = selectedFile || projectHandlers?.selectedFile || null;

  // Update the isTexFile function to be more robust
  const isTexFile = (filePath: string | null | undefined): boolean => {
    if (!filePath) return false;
    
    // Use path.extname to get the file extension reliably
    const extension = path.extname(filePath).toLowerCase();
    console.log("Checking if file is .tex:", { filePath, extension });
    
    return extension === '.tex';
  };

  // Log projectId during component initialization for debugging
  useEffect(() => {
    console.log("ProjectNavbar initialized with:", { 
      propProjectId, 
      urlProjectId: params?.projectId,
      resolvedProjectId: projectId,
      selectedFile
    });
  }, [propProjectId, params?.projectId, projectId, selectedFile]);

  // Add a new toast for timeout errors
  const showTimeoutToast = (maxTime: number, creditCharge: number) => {
    toast.custom((t) => (
      <div className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-orange-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-orange-800">
                Compilation Timeout
              </p>
              <p className="mt-1 text-sm text-orange-700">
                Compilation exceeded the maximum time limit of {maxTime} seconds.
                {creditCharge > 0 ? ` ${creditCharge} credits were charged for the time used.` : ''}
              </p>
              {creditCharge === 0 && (
                <p className="mt-1 text-xs text-orange-600">
                  No credits were charged for this timeout.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button 
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-orange-600 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Close
          </button>
        </div>
      </div>
    ));
  };

  // Update the handleCompileLatex function to handle timeouts
  const handleCompileLatex = async () => {
    // First check if we have the required data
    const currentProjectId = projectId || (params?.projectId as string) || '';
    const fileToCompile = selectedFile || currentFile;
    
    if (!fileToCompile || !currentProjectId) {
      console.error("Cannot compile: selectedFile or projectId is missing", { 
        selectedFile: fileToCompile, 
        projectId: currentProjectId 
      });
      setCompileState('failure');
      toast.error("Unable to compile: Missing file or project data");
      return;
    }
    
    // Check if compilation is already in progress
    if (isCompilationInProgress) {
      console.log("Compilation already in progress, ignoring request");
      return;
    }
    
    // Check if user has sufficient credits before compiling
    const currentCredits = typeof user.credits === 'number' ? user.credits : 0;
    if (currentCredits < 2) {
      console.error("Cannot compile: Insufficient credits", { credits: currentCredits });
      setCompileState('failure');
      toast.error("Insufficient credits. LaTeX compilation requires at least 2 credits.");
      return;
    }
    
    setIsCompiling(true);
    setCompileState('compiling');
    setIsCompilationInProgress(true);
    
    // Create new AbortController for this compilation
    abortControllerRef.current = new AbortController();
    
    try {
      console.log("Starting LaTeX compilation for file:", fileToCompile, "in project:", currentProjectId);
      
      // Construct proper file path to send to API
      // If fileToCompile doesn't start with currentProjectId, add it
      const filePath = fileToCompile.startsWith(currentProjectId) ? 
        fileToCompile : 
        `${currentProjectId}/${fileToCompile}`;
      
      console.log("Using file path for compilation:", filePath);
      
      // First, call the debug endpoint to verify the path
      console.log("Calling debug endpoint first to verify paths...");
      const debugResponse = await fetch('/api/compile/debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: filePath,
          projectId: currentProjectId
        })
      });
      
      if (!debugResponse.ok) {
        console.error("Debug endpoint error:", await debugResponse.text());
        throw new Error("Failed to verify path information");
      }
      
      const debugData = await debugResponse.json();
      console.log("Debug path information:", debugData);
      
      // Check if the debug info looks correct
      if (!debugData.parsed.projectId || !debugData.parsed.relativePath) {
        console.error("Invalid path parsing results:", debugData.parsed);
        throw new Error("Failed to correctly parse file path");
      }

      // Get project settings to determine which compiler to use
      console.log("Fetching project settings...");
      const settingsResponse = await fetch(`/api/projects/${currentProjectId}/settings`);
      
      if (!settingsResponse.ok) {
        console.error("Failed to fetch project settings:", await settingsResponse.text());
        throw new Error('Failed to fetch project settings');
      }
      
      const { settings } = await settingsResponse.json();
      // Get compiler from settings or use pdflatex as fallback
      const compiler = settings?.latexCompiler || 'pdflatex';

      // Get LaTeX compiler flags directly from settings
      // Don't modify or add default flags - use exactly what's in settings
      let compilerFlags: string[] = [];
      if (settings?.latexCompilerFlags) {
        if (Array.isArray(settings.latexCompilerFlags)) {
          // Use the flags directly from settings without modification, but validate them
          compilerFlags = settings.latexCompilerFlags
            .filter((flag: any) => typeof flag === 'string' && flag.trim())
            .map((flag: string) => flag.trim())
            // Add additional validation before sending to prevent errors
            .filter((flag: string) => {
              // Must start with a dash
              if (!flag.startsWith('-')) {
                console.warn(`Skipping invalid flag: ${flag} (doesn't start with dash)`);
                return false;
              }
              
              // Common flag prefixes to check for malformed flags
              const validFlagPrefixes = [
                '-interaction',
                '-file-line-error',
                '-halt-on-error',
                '-shell-escape',
                '-synctex'
              ];
              
              // Check for potential corruption in flags
              for (const validPrefix of validFlagPrefixes) {
                // If it starts with the first few chars of a valid flag but isn't the prefix, likely corrupted
                if (flag.startsWith(validPrefix.substring(0, 5)) && 
                    !flag.startsWith(validPrefix) && 
                    flag.length > 4) {
                  console.warn(`Skipping likely corrupted flag: ${flag}`);
                  return false;
                }
              }
              
              return true;
            });
        } else if (typeof settings.latexCompilerFlags === 'string') {
          // If it's a single string, just use it directly (with validation)
          const flag = settings.latexCompilerFlags.trim();
          if (flag.startsWith('-')) {
            compilerFlags = [flag];
          } else {
            console.warn(`Skipping invalid flag: ${flag} (doesn't start with dash)`);
          }
        }
      }

      // Log the exact flags we're using after validation
      console.log("Using compiler:", compiler, "with validated flags:", compilerFlags);

      // Call the appropriate compiler API
      const compilerUrl = `/api/compile/${compiler}`;
      console.log("Making compilation request to:", compilerUrl);
      
      const response = await fetch(compilerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filePath: filePath,
          flags: compilerFlags,
          userCredits: currentCredits
        }),
        signal: abortControllerRef.current.signal
      });
      
      // First try to get the response as text
      let responseText;
      try {
        responseText = await response.text();
        console.log("Raw API response:", responseText);
      } catch (error) {
        console.error("Failed to read response text:", error);
        throw new Error("Failed to read compilation response");
      }
      
      // Then try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed API response data:", data);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
      // Check for insufficient credits, which uses status code 402
      if (response.status === 402 || data.error === 'INSUFFICIENT_CREDITS') {
        setCompileState('failure');
        toast.error(`Insufficient credits: ${data.details || 'You need more credits to compile LaTeX documents.'}`);
        return;
      }
      
      // Handle timeout which is now indicated in the response payload
      if (data.timedOut) {
        console.log("Setting compile state to timeout");
        // Set the UI state to timeout - ensure this takes precedence
        setCompileState('timeout');
        
        // Show the timeout toast with credit charge information
        const maxTime = data.maxTime || 30; // Default to 30 seconds if not specified
        const creditCharge = data.creditCharge || 0;
        
        console.log("Handling timeout response:", { maxTime, creditCharge, duration: data.duration });
        
        // Show the timeout toast
        showTimeoutToast(maxTime, creditCharge);
        
        // Update duration if available
        if (data.duration) {
          setLastCompileTime(data.duration);
        }
      }
      
      // Store the compilation time if available
      if (data.duration) {
        setLastCompileTime(data.duration);
      }
      
      // Always try to check if a PDF was created, regardless of success or failure
      let pdfPath = null;
      
      // Check if pdfPath is directly provided in the response
      if (data.pdfPath) {
        pdfPath = data.pdfPath;
        setPdfPath(data.pdfPath);
      } else if (data.success) {
        // Try to construct a PDF path if success is true but no path was returned
        const fileName = path.basename(fileToCompile);
        const pdfFileName = fileName.replace(/\.tex$/, '.pdf');
        const constructedPdfPath = `/api/projects/${currentProjectId}/files/view?path=${encodeURIComponent(pdfFileName)}`;
        setPdfPath(constructedPdfPath);
        pdfPath = constructedPdfPath;
      }
      
      // Get the compilation status from the response
      const compilationStatus = data.compilationStatus || (data.success ? 'success' : 'failure');
      
      // Update the UI state based on the compilation status, but prioritize timeout
      if (data.timedOut) {
        setCompileState('timeout'); // Re-affirm timeout state to ensure it's not overridden
      } else {
        setCompileState(compilationStatus as 'success' | 'partial' | 'failure');
      }
      
      // Check if the API call was successful (could be success or partial even on timeout)
      if (response.ok) {
        // Skip showing success/failure toasts for timeouts as we already showed a specialized toast
        if (!data.timedOut) {
          if (compilationStatus === 'success') {
            toast.success("LaTeX document compiled successfully!");
          } else if (compilationStatus === 'partial') {
            toast.custom((t) => (
              <div className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-yellow-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-yellow-800">
                        Compiled with {data.errors?.length || 'some'} errors, but PDF was generated
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-yellow-600 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ));
          } else if (compilationStatus === 'failure') {
            // Only show this if it's not a timeout
            toast.error("Compilation failed. Please check the log for details.");
          }
        }
        
        // Refresh credits if compilation was charged (including timeouts)
        if (data.creditCharge && data.creditCharge > 0) {
          // Attempt to refresh credits
          refreshCredits();
          
          // Show the credit charge in a toast (only for non-timeout cases, as timeouts show their own toast)
          if (!data.timedOut) {
            toast.custom((t) => (
              <div className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-blue-50 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                        <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        {data.creditCharge} {data.creditCharge === 1 ? 'credit' : 'credits'} charged for compilation
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button 
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    OK
                  </button>
                </div>
              </div>
            ));
          }
        }
        
        // Dispatch an event with detailed information about the compilation
        window.dispatchEvent(new CustomEvent('compilation-completed', {
          detail: {
            success: data.success,
            status: compilationStatus,
            timedOut: data.timedOut,
            maxTime: data.maxTime,
            message: data.timedOut 
              ? `Compilation timed out after ${data.maxTime || 30}s (took ${data.duration?.toFixed(1) || '?'}s)` :
              compilationStatus === 'success' 
                ? `Compiled successfully in ${data.duration?.toFixed(1) || '?'}s` : 
              compilationStatus === 'partial' 
                ? `Compiled with ${data.errors?.length || '?'} errors in ${data.duration?.toFixed(1) || '?'}s` : 
              `Failed to compile (${data.duration?.toFixed(1) || '?'}s)`,
            type: data.timedOut ? 'error' :
                 compilationStatus === 'success' ? 'info' : 
                 compilationStatus === 'partial' ? 'warning' : 'error',
            logs: data.logFileExcerpt,
            errors: data.errors,
            warningsCount: data.warningsCount,
            creditCharge: data.creditCharge,
            pdfPath: pdfPath,
            duration: data.duration
          }
        }));
        
        // If a PDF was generated (even with errors), dispatch the PDF ready event
        if (pdfPath) {
          window.dispatchEvent(new CustomEvent('pdf-ready', {
            detail: {
              path: pdfPath,
              title: path.basename(fileToCompile).replace('.tex', '.pdf')
            }
          }));
        }
        
        // Only fetch logs for the TeX Logs panel if explicitly needed
        // This ensures logs are available but doesn't automatically switch to them
        fetchTexLogs(currentProjectId, fileToCompile, data);
      } else {
        // Handle HTTP error
        setCompileState('failure');
        console.error("Compilation request failed with status:", response.status);
        
        // Try to extract error details from the response
        let errorMessage = data?.error || `HTTP Error: ${response.status}`;
        if (data?.details) {
          console.log("Server provided error details:", data.details);
          errorMessage += ` (${data.details})`;
        }

        // Check for timeout in the response even for error responses
        if (data.timedOut) {
          // Ensure the state is set to timeout
          setCompileState('timeout');
          showTimeoutToast(data.maxTime || 30, data.creditCharge || 0);
        } else {
          // Only set state to failure if it's not a timeout
          setCompileState('failure');
        }
        
        // Dispatch an error event
        window.dispatchEvent(new CustomEvent('compilation-error', {
          detail: {
            success: false,
            message: errorMessage,
            type: 'error',
            details: data,
            timedOut: data.timedOut || false, // Include timeout info
            pdfPath: pdfPath, // Still try to use the PDF if it exists
            duration: data?.duration || null // Include duration if available
          }
        }));
        
        // Only show error toast for non-timeout failures (timeouts already show a specialized toast)
        if (!data.timedOut) {
          toast.error(`Failed to compile: ${errorMessage}`);
        }
        
        // Still try to fetch logs
        fetchTexLogs(currentProjectId, fileToCompile, data);
      }
    } catch (error) {
      console.error("Error compiling LaTeX document:", error);
      setCompileState('failure');
      
      // Check if the error was due to abort
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error("Compilation was cancelled.");
        return;
      }
      
      // Handle other errors as before
      let errorMessage = "Failed to compile LaTeX document.";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.log("Error details:", error);
      }
      
      window.dispatchEvent(new CustomEvent('compilation-error', {
        detail: {
          success: false,
          message: errorMessage,
          type: 'error',
          details: { error: errorMessage },
          pdfPath: null,
          duration: lastCompileTime
        }
      }));
      
      toast.error(`${errorMessage} Please try again.`);
    } finally {
      setIsCompiling(false);
      setIsCompilationInProgress(false);
      abortControllerRef.current = null;
      console.log("Compilation process completed");
    }
  };

  // Add a useEffect hook to log state changes (anywhere after the state variables are declared)
  // Add this after the declaration of the compileState state variable (around line 30)
  // Add debug logging for state changes
  useEffect(() => {
    console.log("Compile state changed to:", compileState);
  }, [compileState]);

  // Enhance the compilation event handlers with proper state updates and logging (around line 850)
  // Add a custom event listener for tex logs updates
  useEffect(() => {
    // Handler for TeX logs updates
    const handleTexLogsUpdated = (event: CustomEvent) => {
      const { timedOut, compilationStatus, creditCharge, duration, maxTime } = event.detail;
      
      console.log("Received tex-logs-updated event:", event.detail);
      
      // If timeout information is present, update the UI state
      if (timedOut) {
        console.log("Setting timeout state from tex-logs-updated event");
        setCompileState('timeout');
        
        // If we have duration and credit charge info, show the timeout toast
        if (duration !== null && maxTime) {
          showTimeoutToast(maxTime, creditCharge || 0);
        }
      }
    };
    
    // Add event listener for tex logs updates
    window.addEventListener('tex-logs-updated', handleTexLogsUpdated as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('tex-logs-updated', handleTexLogsUpdated as EventListener);
    };
  }, []);

  // Update the fetchTexLogs function to ensure event detail has all needed info (around line 890)
  const fetchTexLogs = async (projectId: string, texFilePath: string, compilationData?: any) => {
    try {
      // Preserve the full relative path structure while removing projectId prefix if present
      let relativePath = texFilePath;
      
      // If the path starts with the project ID, remove it
      if (relativePath.startsWith(projectId + '/')) {
        relativePath = relativePath.substring(projectId.length + 1);
      }
      
      console.log("Initiating log fetch for:", { projectId, filePath: relativePath });
      console.log("Compilation data for logs:", compilationData);
      
      // Call the logs API
      const response = await fetch('/api/compile/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: projectId,
          filePath: relativePath,
          // Include timeout info if available from compilation data
          timedOut: compilationData?.timedOut || false,
          maxTime: compilationData?.maxTime || 30,
          duration: compilationData?.duration || null
        })
      });
      
      if (!response.ok) {
        console.warn("TeX logs fetch warning: Non-OK response", await response.text());
      }
      
      console.log("TeX logs fetch request completed");
      
      // After fetching logs, dispatch an event to notify the TexLogsPanel to refresh
      const eventDetail = {
        projectId,
        filePath: texFilePath,
        timedOut: compilationData?.timedOut || false,
        compilationStatus: compilationData?.compilationStatus || 'failure',
        creditCharge: compilationData?.creditCharge || 0,
        duration: compilationData?.duration || null,
        maxTime: compilationData?.maxTime || 30
      };
      
      console.log("Dispatching tex-logs-updated event with details:", eventDetail);
      window.dispatchEvent(new CustomEvent('tex-logs-updated', {
        detail: eventDetail
      }));
    } catch (error) {
      console.error("Error fetching TeX logs:", error);
    }
  };

  // Add a function to view the compiled PDF
  const viewCompiledPDF = () => {
    if (pdfPath) {
      const pdfUrl = `/api/files/view?path=${encodeURIComponent(pdfPath)}`;
      window.open(pdfUrl, '_blank');
    }
  };

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Listen for compile trigger from editor (Ctrl+Enter or command palette)
  useEffect(() => {
    const listener = () => {
      handleCompileLatex();
    };
    window.addEventListener('trigger-compile', listener);
    return () => window.removeEventListener('trigger-compile', listener);
  }, [handleCompileLatex]);

  return (
    <div className="flex items-center justify-between w-full h-12 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Left Side - Brand and Project Name */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/dashboard" 
          className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          <span>Dashboard</span>
        </Link>
        <div className="h-4 border-l border-gray-300 dark:border-gray-600"></div>
        
        {/* Project Name - Editable */}
        <div className="flex items-center">
          {isEditingName ? (
            <div className="flex items-center" ref={editNameRef}>
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleEditKeyDown}
                className="px-2 py-0.5 text-xs border rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500 w-full max-w-xs dark:bg-gray-800 dark:border-gray-600"
                placeholder="Project name"
              />
              <button
                onClick={handleSave}
                className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-r-sm hover:bg-blue-600"
                title="Save name"
              >
                Save
              </button>
              <button
                onClick={cancelEditing}
                className="px-2 py-0.5 text-xs ml-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <h2 className="text-sm font-medium truncate mr-2">
                {projectHandlers?.projectName || projectName || "Project"}
              </h2>
              <button
                onClick={startEditing}
                className="p-0.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                title="Edit project name"
                disabled={!projectHandlers?.updateProjectName}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle - Current File */}
      <div className="flex-1 flex justify-center">
        {currentFile && (
          <div className="px-3 py-1 bg-gray-50 dark:bg-gray-700/40 rounded-md max-w-md truncate flex items-center space-x-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400">
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
              <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {getFileName(currentFile)}
            </span>
            
            {/* Add compile button for .tex files */}
            {isTexFile(currentFile) && (
              <div className="flex items-center">
                <button
                  onClick={handleCompileLatex}
                  disabled={isCompiling || user.credits < 2}
                  className={`ml-2 p-1 rounded-md transition-colors flex items-center ${
                    user.credits < 2
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : compileState === 'success' 
                        ? 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20' 
                        : compileState === 'partial'
                          ? 'text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                          : compileState === 'timeout'
                            ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                            : compileState === 'failure'
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                              : 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                  title={
                    user.credits < 2
                      ? 'Insufficient credits. You need at least 2 credits to compile.'
                      : compileState === 'success' 
                        ? 'Compilation succeeded' 
                        : compileState === 'partial' 
                          ? 'Compiled with errors' 
                          : compileState === 'timeout'
                            ? 'Compilation timed out'
                            : compileState === 'failure' 
                              ? 'Failed to compile' 
                              : 'Compile LaTeX document'
                  }
                >
                  {isCompiling ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-xs">Compiling...</span>
                      {lastCompileTime !== null && (
                        <span className="ml-1 text-xs opacity-75">
                          ({Math.floor(lastCompileTime)}s)
                        </span>
                      )}
                    </div>
                  ) : user.credits < 2 ? (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs">Need Credits</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {compileState === 'success' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : compileState === 'partial' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      ) : compileState === 'timeout' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : compileState === 'failure' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <PlayIcon className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs">
                        {compileState === 'success' 
                          ? "Compiled" 
                          : compileState === 'partial'
                            ? "With Errors"
                            : compileState === 'timeout'
                              ? "Timed Out"
                              : compileState === 'failure'
                                ? "Recompile"
                                : "Compile"}
                      </span>
                    </div>
                  )}
                </button>
                
                {/* Compilation time display */}
                {lastCompileTime !== null && !isCompiling && (
                  <span className={`ml-2 text-xs ${
                    compileState === 'timeout' 
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  } px-1.5 py-0.5 rounded flex items-center`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 mr-0.5 ${
                      compileState === 'timeout' ? 'text-orange-500 dark:text-orange-400' : ''
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {lastCompileTime.toFixed(1)}s
                    {compileState === 'timeout' && <span className="ml-1 font-medium">(Timed Out)</span>}
                  </span>
                )}
                
                {/* Prominent timeout badge - keep only this one */}
                {compileState === 'timeout' && (
                  <div className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-800 rounded-full flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500 dark:text-orange-400 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Compilation Timed Out</span>
                  </div>
                )}

                {/* View PDF button - show even if compilation had errors or timeout but PDF was generated */}
                {((compileState === 'success' || compileState === 'partial' || (compileState === 'timeout' && pdfPath)) && pdfPath) && (
                  <button
                    onClick={viewCompiledPDF}
                    className="ml-2 p-1 rounded-md text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors flex items-center"
                    title="View compiled PDF"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="ml-1 text-xs">View PDF</span>
                  </button>
                )}

                {/* Status indicator for partial success */}
                {compileState === 'partial' && (
                  <span className="ml-2 text-xs text-yellow-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    With warnings
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Side - Controls */}
      <div className="flex items-center space-x-3">
        {/* Panel swap and Settings buttons */}
        <button
          onClick={() => projectHandlers?.togglePanelPositions?.()}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Swap editor and viewer panels"
          disabled={!projectHandlers?.togglePanelPositions}
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => projectHandlers?.openSettings?.()}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Project settings"
          disabled={!projectHandlers?.openSettings}
        >
          <CogIcon className="w-4 h-4" />
        </button>
        
        {/* Credits Display with Hover Popover */}
        <div 
          className="relative" 
          ref={creditsRef}
          onMouseEnter={handleCreditsMouseEnter}
          onMouseLeave={handleCreditsMouseLeave}
        >
          <button
            onClick={refreshCredits}
            className={`hidden sm:flex items-center space-x-1 px-2 py-1 text-xs ${
              (typeof user.credits !== 'number' || user.credits < 5)
                ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400' 
                : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-300'
            } rounded-md transition-all group`}
          >
            <CreditCardIcon className={`w-4 h-4 ${
              (typeof user.credits !== 'number' || user.credits < 5)
                ? 'text-red-600 dark:text-red-400' 
                : 'text-blue-600 dark:text-blue-400'
            }`} />
            <span className="font-medium">
              {typeof user.credits === 'number' ? user.credits : 0}
            </span>
            {(typeof user.credits !== 'number' || user.credits < 5) && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <ArrowPathIcon className={`w-3 h-3 text-gray-400 transition-all ${isRefreshing ? 'rotate-180' : ''} group-hover:text-gray-600 dark:group-hover:text-gray-200`} />
          </button>
          
          {/* Credits Popover */}
          {isCreditsPopoverOpen && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4"
              onMouseEnter={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
              }}
              onMouseLeave={handleCreditsMouseLeave}
            >
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-white">Credits Balance</h3>
                <div className="flex items-center">
                  <span className={`text-xl font-bold ${
                    user.credits < 5 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>{user.credits}</span>
                  <button 
                    onClick={refreshCredits} 
                    className="ml-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Refresh credits"
                  >
                    <ArrowPathIcon className={`w-4 h-4 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {user.credits < 5 && (
                <div className="mb-3 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">Low Credit Balance</p>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        {user.credits < 2 ? 
                          "You don't have enough credits to compile LaTeX documents. LaTeX compilation requires at least 2 credits." :
                          "Your credit balance is running low. LaTeX compilation requires at least 2 credits per document."}
                      </p>
                      <a href="/dashboard/billing" className="inline-block mt-2 text-xs font-medium bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700/30 transition-colors">
                        Purchase Credits
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Activity</h4>
                <div className="max-h-48 overflow-y-auto">
                  {isLoadingCreditHistory ? (
                    <div className="flex justify-center py-4">
                      <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : creditHistory.length > 0 ? (
                    <div className="space-y-2">
                      {creditHistory.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-700">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{item.description}</p>
                            <p className="text-gray-500 dark:text-gray-400">{item.date}</p>
                          </div>
                          <span className={`font-semibold ${item.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {item.amount > 0 ? `+${item.amount}` : item.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">No recent activity</p>
                  )}
                </div>
              </div>
              
              <div className="mt-3 text-xs text-center">
                <a href="/dashboard/billing" className="text-blue-600 hover:underline dark:text-blue-400">
                  Purchase more credits
                </a>
                <span className="mx-2 text-gray-400">•</span>
                <a href="/dashboard/credits" className="text-blue-600 hover:underline dark:text-blue-400">
                  View all transactions
                </a>
              </div>
            </div>
          )}
        </div>
        
        {/* User Avatar */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="relative">
              <img
                src={user.image || '/default-avatar.png'}
                alt={user.name || 'User Avatar'}
                className="w-6 h-6 rounded-full ring-1 ring-blue-600/20"
              />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border-1 border-white dark:border-gray-800 rounded-full"></div>
            </div>
          </button>
          
          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 mt-1 w-56 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                <div className="px-2 py-1 space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <HomeIcon className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      router.push('/api/auth/signout');
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 