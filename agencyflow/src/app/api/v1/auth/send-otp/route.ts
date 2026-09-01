import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate Limiting: Max 8 OTP requests per 10 mins per IP
    const rateLimit = await checkRateLimit(ip, 'auth-send-otp', 8, 10 * 60);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.retryAfterSeconds,
        'Too many verification attempts. Please try again in a few minutes.'
      );
    }

    const body = await request.json();
    const validated = sendOtpSchema.parse(body);
    const emailNormalized = validated.email.toLowerCase().trim();

    // Check if user is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'An account with this email address already exists. Please log in.' } },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up older verification entries for this email
    await prisma.emailVerification.deleteMany({
      where: { email: emailNormalized },
    });

    // Save new OTP
    await prisma.emailVerification.create({
      data: {
        email: emailNormalized,
        otpCode,
        expiresAt,
      },
    });

    console.log(`[AgencyFlow Email OTP] 📬 Sent OTP "${otpCode}" to ${emailNormalized} (Valid for 10 mins)`);

    // If n8n webhook or email provider is configured, dispatch the OTP
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'EMAIL_VERIFICATION_OTP',
            toEmail: emailNormalized,
            otpCode,
            subject: `Your AgencyFlow Verification Code: ${otpCode}`,
          }),
        }).catch(() => {});
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${emailNormalized}`,
      // In development mode, provide preview for easy testing
      debugOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to send verification code' } },
      { status: 500 }
    );
  }
}
