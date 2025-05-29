import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    const { email, name } = await req.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER || "smtp.mail.us-east-1.awsapps.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS || "no-reply@assigneditor.site",
        pass: process.env.EMAIL_PASSWORD || "Qwer@1234"
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: {
        name: "CAIHONG",
        address: process.env.EMAIL_ADDRESS || "no-reply@assigneditor.site"
      },
      to: email || process.env.EMAIL_ADDRESS || "no-reply@assigneditor.site",
      subject: "Test Email from CAIHONG",
      text: `Hello, ${name}! This is a test email from CAIHONG.`
    };

    // Send test email
    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);

    return NextResponse.json({ message: 'Test email sent successfully' });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
} 