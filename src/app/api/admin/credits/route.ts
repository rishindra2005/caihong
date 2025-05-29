import { NextResponse } from 'next/server';
import User from '@/lib/db/models/User';
import mongoose from 'mongoose';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  try {
    const { email, amount, password } = await request.json();

    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $inc: { credits: parseInt(amount) } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      credits: user.credits,
      message: `Successfully added ${amount} credits to ${email}`
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to add credits'
    }, { status: 500 });
  }
} 