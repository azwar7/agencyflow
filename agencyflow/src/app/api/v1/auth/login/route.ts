import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createSession, setSessionCookie } from '@/lib/auth-session';
import { verifyPassword } from '@/lib/password';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate Limiting: Max 15 login attempts per 15 minutes per IP
    const rateLimit = await checkRateLimit(ip, 'auth-login', 15, 15 * 60);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.retryAfterSeconds,
        'Too many login attempts. Please try again later.'
      );
    }

    const body = await request.json();
    const validated = loginSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    // 1. Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      include: { workspace: true },
    });

    // Generic error message to prevent account enumeration
    const genericAuthError = { success: false, error: { message: 'Invalid email or password.' } };

    if (!user || !user.workspace) {
      return NextResponse.json(genericAuthError, { status: 401 });
    }

    // 2. Real cryptographic password verification
    const isPasswordValid = await verifyPassword(validated.password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(genericAuthError, { status: 401 });
    }

    // 3. Create database-backed session (generates 256-bit token & stores SHA-256 hash in DB)
    const { rawToken } = await createSession(user.id);

    // 4. Construct safe response payload (raw token is NOT exposed in JSON)
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          agency: user.workspace.name,
          workspaceId: user.workspace.id,
          isFirstLogin: false,
        },
      },
    });

    // 5. Attach secure httpOnly cookie
    setSessionCookie(response, rawToken);

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    console.error('[Login Route] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'An unexpected error occurred during login.' } },
      { status: 500 }
    );
  }
}
