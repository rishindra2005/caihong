import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';
import User from '@/lib/db/models/User';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    const users = await User.find()
      .select('email name createdAt lastLogin')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 