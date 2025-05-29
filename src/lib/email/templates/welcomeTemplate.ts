export function getWelcomeEmailTemplate(name?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CAIHONG</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background: linear-gradient(135deg, #1e3a8a 0%, #4c1d95 50%, #312e81 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, rgba(30, 58, 138, 0.98) 0%, rgba(76, 29, 149, 0.98) 50%, rgba(49, 46, 129, 0.98) 100%); color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);" role="presentation">
              <tr>
                <td style="padding: 48px 40px;">
                  <!-- Header with Logo -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding-bottom: 40px;">
                        <div style="display: inline-block; background: rgba(255, 255, 255, 0.1); padding: 16px; border-radius: 16px;">
                          <img src="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/rocket.svg" alt="Rocket" style="width: 40px; height: 40px; filter: invert(1);">
                        </div>
                        <div style="margin-top: 20px;">
                          <span style="font-size: 32px; font-weight: 700; background: linear-gradient(to right, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                            CAIHONG
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Welcome Message -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding: 0 0 40px 0;">
                        <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                          Welcome${name ? `, ${name}` : ''}!
                        </h1>
                        <p style="margin: 20px 0 0; font-size: 18px; line-height: 1.6; color: #e2e8f0;">
                          Thank you for joining our waitlist! We're excited to have you on board.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Features Grid -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="padding: 0 0 40px 0;">
                        <!-- AI-Powered Creation -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; backdrop-filter: blur(10px);" role="presentation">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td width="60" style="padding-right: 20px;">
                                    <img src="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/openai.svg" alt="AI" style="width: 40px; height: 40px; filter: invert(1);">
                                  </td>
                                  <td>
                                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: white;">AI-Powered Creation</h3>
                                    <p style="margin: 8px 0 0; color: #e2e8f0; line-height: 1.5;">Generate professional documents with a simple prompt</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Smart Templates -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; background: rgba(255, 255, 255, 0.1); border-radius: 12px; backdrop-filter: blur(10px);" role="presentation">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td width="60" style="padding-right: 20px;">
                                    <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/refs/heads/6.x/svgs/regular/file.svg" alt="Templates" style="width: 40px; height: 40px; filter: invert(1);">
                                  </td>
                                  <td>
                                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: white;">Smart Templates</h3>
                                    <p style="margin: 8px 0 0; color: #e2e8f0; line-height: 1.5;">Choose from hundreds of pre-designed templates</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>

                        <!-- Version Control -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; backdrop-filter: blur(10px);" role="presentation">
                          <tr>
                            <td style="padding: 24px;">
                              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                  <td width="60" style="padding-right: 20px;">
                                    <img src="https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/git.svg" alt="Git" style="width: 40px; height: 40px; filter: invert(1);">
                                  </td>
                                  <td>
                                    <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: white;">Built-in Version Control</h3>
                                    <p style="margin: 8px 0 0; color: #e2e8f0; line-height: 1.5;">Full Git integration with collaborative features</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Call to Action -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding: 40px 0;">
                        <div style="background: rgba(255, 255, 255, 0.1); padding: 24px; border-radius: 12px; backdrop-filter: blur(10px); max-width: 400px;">
                          <img src="https://raw.githubusercontent.com/FortAwesome/Font-Awesome/refs/heads/6.x/svgs/solid/check-double.svg" alt="Checkmark" style="width: 32px; height: 32px; filter: invert(1); margin-bottom: 16px;">
                          <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #e2e8f0;">
                            We'll keep you updated on our progress and let you know as soon as we're ready to launch.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Social Links -->
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td align="center" style="padding-top: 40px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                        
                        <p style="margin: 20px 0 0; color: #e2e8f0; font-size: 14px;">
                          © ${new Date().getFullYear()} CAIHONG. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0;">
                          <a href="mailto:contact@assigneditor.site" style="color: #60a5fa; text-decoration: none; font-size: 14px;">contact@assigneditor.site</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
} 