import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Wishlist from '@/lib/db/models/Wishlist';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    const entries = await Wishlist.find()
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Admin waitlist error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    const entry = await Wishlist.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Admin waitlist update error:', error);
    return NextResponse.json(
      { error: 'Failed to update waitlist entry' },
      { status: 500 }
    );
  }
} 