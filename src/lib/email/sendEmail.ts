import nodemailer from 'nodemailer';
import { getWelcomeEmailTemplate } from './templates/welcomeTemplate';

// Create reusable transporter object using AWS WorkMail SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || "smtp.mail.us-east-1.awsapps.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_ADDRESS || "rishi@assigneditor.site",
    pass: process.env.EMAIL_PASSWORD || "rISHI@_2005"
  },
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false
  }
});

// Verify SMTP connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

export async function sendWelcomeEmail(recipientEmail: string, name?: string) {
  try {
    // Clean up email and name
    recipientEmail = recipientEmail.trim().toLowerCase();
    if (name) {
      name = name.trim();
      if (name.length === 0) name = undefined;
    }

    const mailOptions = {
      from: {
        name: "CAIHONG",
        address: process.env.EMAIL_ADDRESS || "rishi@assigneditor.site"
      },
      to: recipientEmail,
      subject: "Welcome to CAIHONG Waitlist!",
      html: getWelcomeEmailTemplate(name),
      headers: {
        'X-Priority': '1', // Highest priority
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
} 