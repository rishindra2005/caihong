import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/config/auth';
import User from '@/lib/db/models/User';
import mongoose from 'mongoose';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const user = await User.findById(session.user.id)
      .select('-google.id')
      .populate('projects', 'name description createdAt');
      
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const updates: any = {
      name: formData.get('name'),
      metadata: formData.get('metadata')
    };

    const imageData = formData.get('image');
    if (imageData && typeof imageData === 'string' && imageData.startsWith('data:image')) {
      updates.image = imageData;
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Simple update without conflicting credit operations
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}