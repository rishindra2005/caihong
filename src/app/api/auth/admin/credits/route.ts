import { NextResponse } from 'next/server';
import User from '@/lib/db/models/User';
import mongoose from 'mongoose';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  try {
    const { email, amount, password } = await request.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    const user = await User.findOneAndUpdate(
      { email },
      { $inc: { credits: amount } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      credits: user.credits 
    });
  } catch (error) {
    console.error('Add credits error:', error);
    return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
  }
}
