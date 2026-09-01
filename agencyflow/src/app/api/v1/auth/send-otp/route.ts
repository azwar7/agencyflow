import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';
import { sendOtpEmail } from '@/lib/email';

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate Limiting: Max 10 OTP requests per 10 mins per IP
    const rateLimit = await checkRateLimit(ip, 'auth-send-otp', 10, 10 * 60);
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

    // Send the email via Gmail SMTP / Webhook
    await sendOtpEmail({
      to: emailNormalized,
      otpCode,
    });

    return NextResponse.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${emailNormalized}`,
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
