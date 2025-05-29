import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';
import Wishlist from '@/lib/db/models/Wishlist';
import User from '@/lib/db/models/User';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Get total users count
    const totalUsers = await User.countDocuments();

    // Get waitlist stats
    const totalWaitlist = await Wishlist.countDocuments();
    const pendingApprovals = await Wishlist.countDocuments({ status: 'pending' });

    // Get recent signups (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: oneDayAgo }
    });

    return NextResponse.json({
      totalUsers,
      totalWaitlist,
      pendingApprovals,
      recentSignups
    });
  } catch (error) {
    console.error('Admin dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 