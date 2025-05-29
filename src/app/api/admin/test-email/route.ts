import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';
import { sendWelcomeEmail } from '@/lib/email/sendEmail';

export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    const { name } = await req.json();
    
    // Send test email to the admin's email address
    const success = await sendWelcomeEmail(
      process.env.EMAIL_ADDRESS || "rishi@assigneditor.site",
      name
    );

    if (!success) {
      throw new Error('Failed to send test email');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
} 