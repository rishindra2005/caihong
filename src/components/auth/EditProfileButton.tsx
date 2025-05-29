'use client';

import { useState } from 'react';
import EditProfileDialog from './EditProfileDialog';

interface User {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  credits?: number;
  metadata?: string;
}

export default function EditProfileButton({ user }: { user: User | null | undefined }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors w-full"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
        <span>Edit Profile</span>
      </button>
      {isOpen && <EditProfileDialog user={user} onClose={() => setIsOpen(false)} />}
    </>
  );
} 