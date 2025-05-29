import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';
import Wishlist from '@/lib/db/models/Wishlist';

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    await mongoose.connect(process.env.MONGODB_URI!);
    
    // Get total counts by status
    const statusCounts = await Wishlist.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get signups over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySignups = await Wishlist.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get conversion rates
    const totalSignups = await Wishlist.countDocuments();
    const approvedSignups = await Wishlist.countDocuments({ status: 'approved' });
    const conversionRate = totalSignups > 0 ? (approvedSignups / totalSignups) * 100 : 0;

    // Format the response
    const statusCountsFormatted = Object.fromEntries(
      statusCounts.map(({ _id, count }) => [_id, count])
    );

    // Fill in missing dates with zero counts
    const dateRange = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dailySignupsMap = new Map(
      dailySignups.map(({ _id, count }) => [_id, count])
    );

    const timeSeriesData = dateRange.map(date => ({
      date,
      count: dailySignupsMap.get(date) || 0
    }));

    return NextResponse.json({
      statusCounts: statusCountsFormatted,
      timeSeriesData,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      totalSignups
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 