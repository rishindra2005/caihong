import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    const config = await req.json();

    // Create a test transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify the connection
    await transporter.verify();

    return NextResponse.json({ message: 'SMTP configuration verified successfully' });
  } catch (error) {
    console.error('SMTP verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify SMTP configuration' },
      { status: 500 }
    );
  }
} 