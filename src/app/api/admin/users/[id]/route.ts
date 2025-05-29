import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';
import User from '@/lib/db/models/User';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    const { id } = params;

    await mongoose.connect(process.env.MONGODB_URI!);
    
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 