import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Wishlist from '@/lib/db/models/Wishlist';

// Get total count of waitlist signups
export async function GET() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const count = await Wishlist.countDocuments({ status: 'pending' });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Wishlist count error:', error);
    return NextResponse.json(
      { error: 'Failed to get waitlist count' },
      { status: 500 }
    );
  }
}

// Add new signup to waitlist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    // Check if email already exists
    const existing = await Wishlist.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create new wishlist entry
    const wishlist = await Wishlist.create({
      email: email.toLowerCase(),
      name,
      status: 'pending'
    });

    return NextResponse.json({
      message: 'Successfully joined waitlist',
      data: wishlist
    });
  } catch (error) {
    console.error('Wishlist signup error:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    );
  }
} 