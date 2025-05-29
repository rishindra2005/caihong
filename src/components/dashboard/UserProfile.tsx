interface UserProfileProps {
  user: {
    id: string;
    credits: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="relative">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 h-32" />
        
        {/* Profile content */}
        <div className="relative pt-16 pb-6 px-6">
          <div className="flex flex-col items-center">
            <img 
              src={user.image || '/default-avatar.png'} 
              alt={user.name || 'User Avatar'}
              className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 shadow-lg"
            />
            <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
              {user.name || 'Anonymous User'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Available Credits
              </span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {user.credits}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
