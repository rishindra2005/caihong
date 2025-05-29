import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { adminAuthMiddleware } from '@/lib/middleware/adminAuth';
import { getWelcomeEmailTemplate } from '@/lib/email/templates/welcomeTemplate';
import { getOfferLetterTemplate } from '@/lib/email/templates/offerLetterTemplate';

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResponse = await adminAuthMiddleware(req);
    if (authResponse.status === 401) {
      return authResponse;
    }

    const { smtp, recipients, subject, template, variables, templateId } = await req.json();

    // Create transporter with provided SMTP config
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.password
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Get the final HTML content based on template type
    let htmlContent: string;
    if (templateId === 'welcome') {
      // For welcome template, use the direct function call
      htmlContent = getWelcomeEmailTemplate(variables['name']);
    } else if (templateId === 'offer-letter') {
      // For offer letter template, use the direct function call with all variables
      htmlContent = getOfferLetterTemplate(
        variables['name'],
        variables['startDate'],
        variables['email'],
        variables['password'],
        variables['role'],
        variables['description']
      );
    } else {
      // For other templates, use variable replacement
      htmlContent = template;
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          htmlContent = htmlContent.replace(
            new RegExp(`\\$\\{${key}\\}|\\{\\{${key}\\}\\}`, 'g'),
            value as string
          );
        });
      }
    }

    // Send email to all recipients
    const results = await Promise.all(
      recipients.map(async (recipient: string) => {
        try {
          const info = await transporter.sendMail({
            from: {
              name: "CAIHONG",
              address: smtp.user
            },
            to: recipient,
            subject,
            html: htmlContent,
            headers: {
              'X-Priority': '1',
              'X-MSMail-Priority': 'High',
              'Importance': 'high'
            }
          });
          return { recipient, success: true, messageId: info.messageId };
        } catch (error) {
          console.error(`Failed to send email to ${recipient}:`, error);
          return { recipient, success: false, error: (error as Error).message };
        }
      })
    );

    // Check if any emails failed to send
    const failures = results.filter(result => !result.success);
    if (failures.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Some emails failed to send',
        results
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All emails sent successfully',
      results
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send emails',
      error: (error as Error).message
    }, { status: 500 });
  }
}