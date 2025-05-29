import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import User from '@/lib/db/models/User';
import CreditHistory from '@/lib/db/models/CreditHistory';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, description, projectId, action } = await request.json();
    
    // Validate the amount
    const debitAmount = Math.abs(parseFloat(amount)) * -1; // Ensure it's negative
    if (isNaN(debitAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    // First, find the user
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if the user has enough credits and adjust debitAmount if needed
    let adjustedDebitAmount = debitAmount;
    if (user.credits + debitAmount < 0) {
      adjustedDebitAmount = user.credits * -1; // Will reduce credits to exactly 0
    }

    const beforeBalance = user.credits;
    const afterBalance = beforeBalance + adjustedDebitAmount;

    try {
      // Try using transactions if supported
      const mongoSession = await mongoose.startSession();
      let transactionSupported = true;
      
      try {
        // Start transaction
        mongoSession.startTransaction();
        
        // Update the user's credits
        await User.findByIdAndUpdate(
          user._id,
          { credits: afterBalance },
          { session: mongoSession, new: true }
        );
        
        // Create a history record
        await CreditHistory.create([{
          userId: user._id,
          amount: adjustedDebitAmount,
          beforeBalance,
          afterBalance,
          description,
          projectId: projectId || undefined,
          action: action || undefined,
          timestamp: new Date()
        }], { session: mongoSession });
        
        // Commit the transaction
        await mongoSession.commitTransaction();
      } catch (error) {
        // If transaction fails, abort and set flag to try without transactions
        if (mongoSession.inTransaction()) {
          await mongoSession.abortTransaction();
        }
        
        if (error instanceof Error && 
            (error.message.includes('Transaction') || 
             error.message.includes('transaction') ||
             error.message.includes('replica set'))) {
          transactionSupported = false;
        } else {
          throw error;
        }
      } finally {
        await mongoSession.endSession();
      }
      
      // If transactions aren't supported, perform operations sequentially
      if (!transactionSupported) {
        // Update user's credits
        await User.findByIdAndUpdate(user._id, { credits: afterBalance });
        
        // Create credit history
        await CreditHistory.create({
          userId: user._id,
          amount: adjustedDebitAmount,
          beforeBalance,
          afterBalance,
          description,
          projectId: projectId || undefined,
          action: action || undefined,
          timestamp: new Date()
        });
      }
      
      return NextResponse.json({ 
        success: true,
        credits: afterBalance
      });
    } catch (error) {
      console.error('Subtract credits error:', error);
      return NextResponse.json({ error: 'Failed to subtract credits', details: error instanceof Error ? error.message : undefined }, { status: 500 });
    }
  } catch (error) {
    console.error('Subtract credits error:', error);
    return NextResponse.json({ error: 'Failed to subtract credits' }, { status: 500 });
  }
} 