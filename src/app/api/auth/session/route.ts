import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/config/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  return NextResponse.json({
    authenticated: !!session,
    session,
  });
}
