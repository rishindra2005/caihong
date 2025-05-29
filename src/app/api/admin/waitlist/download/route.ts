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

    // Convert dates to ISO strings for better readability
    const formattedEntries = entries.map(entry => ({
      ...entry,
      signupDate: new Date(entry.signupDate).toISOString(),
      createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : undefined,
      updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : undefined,
    }));

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', 'attachment; filename=waitlist-data.json');

    return new NextResponse(JSON.stringify(formattedEntries, null, 2), {
      headers,
    });
  } catch (error) {
    console.error('Admin waitlist download error:', error);
    return NextResponse.json(
      { error: 'Failed to download waitlist data' },
      { status: 500 }
    );
  }
} 