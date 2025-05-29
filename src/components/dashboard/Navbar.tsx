import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import EditProfileButton from '@/components/auth/EditProfileButton';
import SignOutButton from '@/components/auth/SignOutButton';
import { HomeIcon, UserCircleIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const session = await getServerSession(authOptions);

  if (!session?.user) return null;

  return (
    <div className="flex items-center justify-between w-full relative z-50">
      {/* Logo/Brand */}
      <Link 
        href="/dashboard" 
        className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
      >
        <HomeIcon className="w-6 h-6 text-blue-600" />
        <span>CAI_HONG</span>
      </Link>

      <NavbarClient user={session.user} />
    </div>
  );
}
