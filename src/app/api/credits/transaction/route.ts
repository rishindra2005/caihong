import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/config/auth';
import mongoose from 'mongoose';
import User from '@/lib/db/models/User';
import CreditHistory from '@/lib/db/models/CreditHistory';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);

    // Parse request body
    const body = await req.json();
    const { amount, description, projectId, action } = body;

    // Validate required fields
    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Amount and description are required' },
        { status: 400 }
      );
    }

    // Start a session for transaction
    const session_db = await mongoose.startSession();
    session_db.startTransaction();

    try {
      // Get current user with credits
      const user = await User.findById(session.user.id);
      if (!user) {
        await session_db.abortTransaction();
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const beforeBalance = user.credits;
      const afterBalance = beforeBalance + amount;

      // For debits, ensure sufficient credits
      if (amount < 0 && afterBalance < 0) {
        await session_db.abortTransaction();
        return NextResponse.json(
          { error: 'Insufficient credits' },
          { status: 400 }
        );
      }

      // Update user credits
      user.credits = afterBalance;
      await user.save({ session: session_db });

      // Create transaction record
      const transaction = new CreditHistory({
        userId: session.user.id,
        amount,
        beforeBalance,
        afterBalance,
        description,
        projectId: amount < 0 ? projectId : undefined,
        action: amount < 0 ? action : undefined,
        createdAt: new Date()
      });

      await transaction.save({ session: session_db });
      await session_db.commitTransaction();

      return NextResponse.json({
        success: true,
        transaction: {
          id: transaction._id,
          amount,
          beforeBalance,
          afterBalance,
          description,
          createdAt: transaction.createdAt
        }
      });
    } catch (error) {
      await session_db.abortTransaction();
      throw error;
    } finally {
      session_db.endSession();
    }
  } catch (error) {
    console.error('Error processing credit transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
} 