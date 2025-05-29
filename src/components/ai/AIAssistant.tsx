'use client';

import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface AIAssistantProps {
  projectId: string;
}

export default function AIAssistant({ projectId }: AIAssistantProps) {
  return (
    <div className="flex flex-col h-full border-l">
      <div className="p-4 border-b bg-blue-50 dark:bg-blue-900/20">
        <h3 className="font-medium">AI Assistant</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions or get help with your code</p>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3" />
          <p className="font-medium">AI Assistant Coming Soon</p>
          <p className="text-sm mt-2">This feature is currently under development</p>
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
            <p className="text-sm mb-2">Future capabilities:</p>
            <ul className="list-disc text-xs space-y-1 ml-4">
              <li>Analyze your code and provide suggestions</li>
              <li>Help debug issues in your project</li>
              <li>Generate code snippets based on your requirements</li>
              <li>Answer questions about your codebase</li>
              <li>Explain complex algorithms and patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 