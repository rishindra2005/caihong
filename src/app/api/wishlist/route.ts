import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Wishlist from '@/lib/db/models/Wishlist';
import { sendWelcomeEmail } from '@/lib/email/sendEmail';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    let { email, name } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Clean and validate email format
    email = email.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    // Check if email already exists
    const existing = await Wishlist.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Clean name input
    if (name) {
      name = name.trim();
      if (name.length === 0) name = undefined;
    }

    // Create new wishlist entry
    const wishlist = await Wishlist.create({
      email,
      name,
      status: 'pending'
    });

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't return error to user, just log it
    }

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