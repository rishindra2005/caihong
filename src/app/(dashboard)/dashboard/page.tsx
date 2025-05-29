import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import UserProfile from '@/components/dashboard/UserProfile';
import ProjectList from '@/components/dashboard/ProjectList';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <UserProfile user={session!.user} />
        </div>
        <div className="lg:col-span-3">
          <ProjectList userId={session!.user.id} />
        </div>
      </div>
    </div>
  );
}
