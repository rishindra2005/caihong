import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/middleware/adminAuth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value || null;
    
    if (!await verifyAdminToken(token)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({ isAuthenticated: true });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
} 