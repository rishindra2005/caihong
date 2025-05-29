import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_SSH_KEY || '');

export async function verifyAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  
  try {
    await jose.jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function adminAuthMiddleware(request: NextRequest) {
  const token = request.cookies.get('admin_token')?.value || null;
  
  if (!await verifyAdminToken(token)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return NextResponse.next();
}

export async function createAdminToken(sshKey: string): Promise<string | null> {
  if (sshKey !== process.env.ADMIN_SSH_KEY) {
    return null;
  }

  const jwt = await new jose.SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return jwt;
} 