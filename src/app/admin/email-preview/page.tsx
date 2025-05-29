'use client';

import { useState } from 'react';
import { getWelcomeEmailTemplate } from '@/lib/email/templates/welcomeTemplate';

export default function EmailPreviewPage() {
  const [name, setName] = useState('');
  const template = getWelcomeEmailTemplate(name);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Email Template Preview
            </h1>
            
            {/* Controls */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Test with Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md"
                  placeholder="Enter a name to test personalization"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Preview
                </h2>
              </div>
              <iframe
                srcDoc={template}
                className="w-full h-[800px] border-0"
                title="Email Preview"
              />
            </div>

            {/* Test Send Button */}
            <div className="mt-6">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/test-email', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ name }),
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to send test email');
                    }

                    alert('Test email sent successfully!');
                  } catch (error) {
                    alert('Failed to send test email: ' + error);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Send Test Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 