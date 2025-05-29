'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context interface
interface AIContextType {
  fileContext: string;
  setFileContext: (content: string) => void;
  // Add more AI-related functions and state as needed in the future
}

// Create the context with default values
const AIContext = createContext<AIContextType>({
  fileContext: '',
  setFileContext: () => {},
});

// Provider component
export function AIProvider({ children }: { children: ReactNode }) {
  const [fileContext, setFileContext] = useState<string>('');

  // The value object that will be available to consumers of the context
  const value = {
    fileContext,
    setFileContext,
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

// Custom hook to use the AI context
export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
} 