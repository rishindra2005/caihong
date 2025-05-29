import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import CreditHistory from '@/lib/db/models/CreditHistory';
import User from '@/lib/db/models/User';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');
    
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    // Get the current user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent credit history
    const history = await CreditHistory.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('projectId', 'name'); // Populate project name if available
    
    return NextResponse.json({ 
      success: true,
      history: history.map(entry => ({
        id: entry._id,
        amount: entry.amount,
        beforeBalance: entry.beforeBalance,
        afterBalance: entry.afterBalance,
        description: entry.description,
        projectId: entry.projectId?._id || entry.projectId,
        projectName: entry.projectId?.name,
        action: entry.action,
        timestamp: entry.timestamp,
        date: new Date(entry.timestamp).toLocaleString()
      }))
    });
  } catch (error) {
    console.error('Get credit history error:', error);
    return NextResponse.json({ error: 'Failed to get credit history' }, { status: 500 });
  }
} 