import nodemailer from 'nodemailer';

interface SendOtpEmailOptions {
  to: string;
  otpCode: string;
}

export async function sendOtpEmail({ to, otpCode }: SendOtpEmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const gmailUser = (process.env.GMAIL_USER || 'azwarsalar1122@gmail.com').trim();
    const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

    // 1. If Gmail App Password is configured, send live via Gmail SMTP
    if (gmailPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0d14; color: #ffffff; padding: 20px; margin: 0; }
            .container { max-width: 480px; margin: 0 auto; background: #161922; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 32px 24px; text-align: center; }
            .logo { font-size: 20px; font-weight: 900; color: #38bdf8; letter-spacing: -0.5px; margin-bottom: 24px; }
            .logo span { color: #ffffff; }
            .title { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
            .subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 24px; line-height: 1.5; }
            .otp-box { background: rgba(56, 189, 248, 0.1); border: 2px dashed #38bdf8; border-radius: 8px; padding: 16px; margin: 24px 0; }
            .otp-code { font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #38bdf8; font-family: monospace; }
            .footer { font-size: 12px; color: #64748b; margin-top: 24px; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">⚡ Agency<span>Flow</span></div>
            <div class="title">Verify Your Email Address</div>
            <div class="subtitle">Use the verification code below to complete your AgencyFlow CRM workspace setup:</div>
            
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
            </div>

            <div class="subtitle" style="font-size: 13px;">This 6-digit code will expire in <strong>10 minutes</strong>.</div>
            
            <div class="footer">
              If you did not request this email, you can safely ignore it.<br>
              © ${new Date().getFullYear()} AgencyFlow Security. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"AgencyFlow Security" <${gmailUser}>`,
        replyTo: `no-reply@agencyflow.io`,
        to,
        subject: `${otpCode} is your AgencyFlow verification code`,
        text: `Your AgencyFlow verification code is: ${otpCode}. It expires in 10 minutes.`,
        html: htmlContent,
      });

      console.log(`[Email Service] ✉️ Real Gmail sent to ${to} via SMTP!`);
      return { success: true };
    }

    // 2. If n8n webhook is configured, dispatch via n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'EMAIL_VERIFICATION_OTP',
            fromName: 'AgencyFlow Security',
            fromEmail: 'no-reply@agencyflow.io',
            toEmail: to,
            otpCode,
            subject: `${otpCode} is your AgencyFlow verification code`,
          }),
        });
        console.log(`[Email Service] ✉️ Dispatched OTP via n8n webhook`);
      } catch (webhookErr) {
        console.error('[Email Service] Webhook dispatch error:', webhookErr);
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Email Service] Send failed:', error);
    return { success: false, error: error.message };
  }
}
