import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/config/auth';
import { AIProvider } from '@/components/ai/AIProvider';
import SignOutButton from '@/components/auth/SignOutButton';
import EditProfileButton from '@/components/auth/EditProfileButton';
import Navbar from '@/components/dashboard/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="dashboard-main-nav bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <Navbar />
          </div>
        </div>
      </nav>
      <AIProvider>
        <main className="dashboard-main-content w-full">
          {children}
        </main>
      </AIProvider>
    </div>
  );
}
