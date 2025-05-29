import { NextResponse } from 'next/server';
import User from '@/lib/db/models/User';
import CreditHistory from '@/lib/db/models/CreditHistory';
import mongoose from 'mongoose';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: Request) {
  try {
    const { email, amount, description, password } = await request.json();

    if (!ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Validate the amount
    const creditAmount = Math.abs(parseFloat(amount)); // Ensure it's positive
    if (isNaN(creditAmount)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    
    // First, find the user
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const beforeBalance = user.credits;
    const afterBalance = beforeBalance + creditAmount;

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
          amount: creditAmount,
          beforeBalance,
          afterBalance,
          description,
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
          amount: creditAmount,
          beforeBalance,
          afterBalance,
          description,
          timestamp: new Date()
        });
      }
      
      return NextResponse.json({ 
        success: true,
        credits: afterBalance,
        message: `Successfully added ${creditAmount} credits to ${email}`
      });
    } catch (error) {
      console.error('Add credits error:', error);
      return NextResponse.json({ 
        error: 'Failed to add credits',
        details: error instanceof Error ? error.message : undefined
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Add credits error:', error);
    return NextResponse.json({ 
      error: 'Failed to add credits',
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
} 