export const getOfferLetterTemplate = (
  name: string = '[name]',
  startDate: string = '[start-date]',
  email: string = '[email]',
  password: string = '[password]',
  role: string = '[role]',
  description: string = '[description]'
) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CAIHONG Internship Offer Letter</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          background: #f8f9fa;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
        }
        .content {
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #4f46e5;
          margin-bottom: 20px;
          font-size: 28px;
        }
        .highlight {
          color: #6366f1;
          font-weight: bold;
        }
        .credentials-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .confidentiality-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 0.9em;
          color: #555;
        }
        .signature {
          margin-top: 40px;
          border-top: 2px solid #e2e8f0;
          padding-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="content">
          <div class="header">
            <h1>Internship Offer Letter</h1>
          </div>

          <p>Date: ${currentDate}</p>

          <p>Dear <span class="highlight">${name}</span>,</p>

          <p>We are delighted to offer you a remote internship position at CAIHONG as a <span class="highlight">${role}</span>. We were thoroughly impressed by your skills, qualifications, and enthusiasm during the interview process, and we are confident that you will be a valuable addition to our dynamic and innovative team.</p>

          <h2>Position Details:</h2>
          <ul>
            <li><strong>Role:</strong> ${role}</li>
            <li><strong>Start Date:</strong> ${startDate}</li>
            <li><strong>Work Location:</strong> Remote (This is a fully remote internship, allowing you to work from your preferred location.)</li>
          </ul>

          <p><strong>Role Description:</strong><br>${description}</p>
          <p>In this role, you will have the opportunity to contribute to meaningful projects, collaborate with experienced professionals, and gain hands-on experience in your field. We are committed to providing a supportive and engaging learning environment.</p>

          <div class="credentials-box">
            <h3>Your Official CAIHONG Account Credentials:</h3>
            <p>To help you get started, we have created an official CAIHONG email account for you:</p>
            <p><strong>Email:</strong> <span class="highlight">${email}</span><br>
            <strong>Initial Password:</strong> <span class="highlight">${password}</span></p>
            <p><em>For security reasons, please log in to this account immediately upon receipt of this letter and change your password. This email account will be your primary point of contact for all official internship-related communications and access to CAIHONG resources.</em></p>
          </div>

          <h2>What We Offer:</h2>
          <ul>
            <li>A flexible and supportive remote work environment.</li>
            <li>Direct mentorship from experienced professionals in the AI and technology space.</li>
            <li>Opportunities to gain hands-on experience with cutting-edge technologies and real-world projects.</li>
            <li>Regular feedback sessions and personalized growth plans to help you develop your skills.</li>
            <li>Networking opportunities with our team and other professionals in the industry.</li>
            <li>A chance to make a tangible impact on innovative AI-powered solutions.</li>
          </ul>

          <p>Your journey at CAIHONG will involve working closely with our team on various exciting projects that are integral to our mission of revolutionizing AI-powered solutions. We believe this internship will provide you with a solid foundation and a stepping stone for your future career.</p>

          <h2>Next Steps to Accept This Offer:</h2>
          <p>To formally accept this internship offer and begin your journey with CAIHONG, please complete the following steps by <span class="highlight">[Acceptance Deadline - e.g., 5 business days from date of offer]</span>:</p>
          <ol>
            <li><strong>Reply to this Email:</strong> Send an email to your hiring manager or HR contact confirming your acceptance of this offer.</li>
            <li><strong>Access Your CAIHONG Email:</strong> Log in to your official CAIHONG email account (<span class="highlight">${email}</span>) using the initial password provided above. Remember to change your password immediately.</li>
            <li><strong>Complete Onboarding Documentation:</strong> Inside your CAIHONG email inbox, you will find a welcome email. This email contains important information and a secure link to our onboarding portal. Please follow the instructions to complete all necessary documentation, set up your profile, and familiarize yourself with our company policies and tools. This step is crucial for a smooth start.</li>
          </ol>
          <p>We are eager to have you join our team and look forward to your contributions. If you have any questions before accepting, please do not hesitate to reach out to us.</p>

          <div class="confidentiality-section">
            <h3>Confidentiality Agreement:</h3>
            <p>As an intern at CAIHONG, you will have access to confidential information, including but not limited to proprietary software, client data, business strategies, and trade secrets. By accepting this offer, you agree to maintain the strictest confidentiality of all such information, both during and after your internship. You agree not to disclose, use, or distribute any confidential information for any purpose other than the performance of your duties at CAIHONG. Unauthorized disclosure may lead to disciplinary action, up to and including termination of your internship and potential legal action. A more detailed confidentiality agreement will be part of your onboarding documentation.</p>
          </div>

          <div class="signature">
            <p>Sincerely,<br>
            The Human Resources Team<br>
            CAIHONG<br>
            <a href="mailto:hr@assigneditor.site" style="color: #6366f1;">hr@assigneditor.site</a><br>
            <a href="https://www.assigneditor.site" style="color: #6366f1;">www.assigneditor.site</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}; 