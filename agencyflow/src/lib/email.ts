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

export type NotificationCategory = 'DEALS' | 'TASKS' | 'PROPOSALS' | 'INVOICES' | 'SECURITY';

/**
 * Checks whether a notification should be delivered based on the user's granular preferences.
 * Security-critical notifications are NEVER suppressible.
 */
export async function shouldSendNotification(
  userId: string,
  category: NotificationCategory,
  channel: 'email' | 'inApp'
): Promise<boolean> {
  // Security-critical notifications cannot be disabled by user preferences
  if (category === 'SECURITY') return true;

  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      notifyEmailDeals: true,
      notifyEmailTasks: true,
      notifyEmailProposals: true,
      notifyEmailInvoices: true,
      notifyInAppDeals: true,
      notifyInAppTasks: true,
      notifyInAppProposals: true,
      notifyInAppInvoices: true,
    },
  });

  if (!user) return false;

  if (channel === 'email') {
    switch (category) {
      case 'DEALS':
        return user.notifyEmailDeals;
      case 'TASKS':
        return user.notifyEmailTasks;
      case 'PROPOSALS':
        return user.notifyEmailProposals;
      case 'INVOICES':
        return user.notifyEmailInvoices;
      default:
        return true;
    }
  } else {
    switch (category) {
      case 'DEALS':
        return user.notifyInAppDeals;
      case 'TASKS':
        return user.notifyInAppTasks;
      case 'PROPOSALS':
        return user.notifyInAppProposals;
      case 'INVOICES':
        return user.notifyInAppInvoices;
      default:
        return true;
    }
  }
}

/**
 * Dispatches an automated CRM notification email, verifying user preferences first.
 */
export async function sendNotificationEmail({
  userId,
  to,
  category,
  subject,
  content,
}: {
  userId: string;
  to: string;
  category: NotificationCategory;
  subject: string;
  content: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const allowed = await shouldSendNotification(userId, category, 'email');
  if (!allowed) {
    return { sent: false, reason: `Suppressed by user email preference for category: ${category}` };
  }

  const gmailUser = (process.env.GMAIL_USER || 'azwarsalar1122@gmail.com').trim();
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').trim();

  if (gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });

      await transporter.sendMail({
        from: `"AgencyFlow Alerts" <${gmailUser}>`,
        replyTo: 'no-reply@agencyflow.io',
        to,
        subject,
        text: content,
        html: `<div style="font-family: sans-serif; background:#0f172a; color:#f8fafc; padding:24px; border-radius:8px;">
          <h2 style="color:#38bdf8;">⚡ AgencyFlow</h2>
          <p style="font-size:16px;">${content}</p>
          <hr style="border:0; border-top:1px solid #334155; margin:20px 0;" />
          <small style="color:#94a3b8;">You received this email according to your AgencyFlow notification preferences.</small>
        </div>`,
      });
      return { sent: true };
    } catch (err: any) {
      return { sent: false, reason: err.message };
    }
  }

  return { sent: true, reason: 'Dispatched via mock/development pipeline' };
}

