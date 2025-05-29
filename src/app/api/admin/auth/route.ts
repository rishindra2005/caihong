import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminToken } from '@/lib/middleware/adminAuth';

export async function POST(req: NextRequest) {
  try {
    const { sshKey } = await req.json();

    if (!sshKey) {
      return NextResponse.json(
        { error: 'SSH key is required' },
        { status: 400 }
      );
    }

    const token = await createAdminToken(sshKey);

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid SSH key' },
        { status: 401 }
      );
    }

    // Create the response
    const response = NextResponse.json({ 
      message: 'Authentication successful',
      isAdmin: true
    });

    // Set the token in an HTTP-only cookie
    response.cookies.set({
      name: 'admin_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Create the response
  const response = NextResponse.json({ 
    message: 'Logged out successfully' 
  });

  // Clear the admin token cookie
  response.cookies.set({
    name: 'admin_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
} 