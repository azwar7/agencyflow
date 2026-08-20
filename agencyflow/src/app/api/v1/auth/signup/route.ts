import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createSession, setSessionCookie } from '@/lib/auth-session';
import { hashPassword } from '@/lib/password';
import { checkRateLimit, getClientIp, createRateLimitResponse } from '@/lib/rate-limiter';

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  agencyName: z.string().min(1, 'Agency name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate Limiting: Max 10 signup attempts per hour per IP
    const rateLimit = await checkRateLimit(ip, 'auth-signup', 10, 60 * 60);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.retryAfterSeconds,
        'Too many account creation attempts. Please try again later.'
      );
    }

    const body = await request.json();
    const validated = signupSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'An account with this email address already exists. Please log in.' } },
        { status: 400 }
      );
    }

    // 2. Generate clean slug
    const baseSlug = validated.agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug || 'agency'}-${randomSuffix}`;

    // 3. Real cryptographic password hash using bcrypt (12 rounds)
    const passwordHash = await hashPassword(validated.password);

    // 4. Atomic database creation
    const result = await prisma.$transaction(
      async (tx) => {
        const workspace = await tx.workspace.create({
          data: {
            name: validated.agencyName.trim(),
            slug,
          },
        });

        const user = await tx.user.create({
          data: {
            workspaceId: workspace.id,
            email: emailNormalized,
            fullName: validated.fullName.trim(),
            role: 'OWNER',
            passwordHash,
          },
        });

        return { workspace, user };
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    // 5. Create database-backed session
    const { rawToken } = await createSession(result.user.id);

    // 6. Safe response payload (no tokens exposed in JSON)
    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.fullName,
          role: result.user.role,
          agency: result.workspace.name,
          workspaceId: result.workspace.id,
          isFirstLogin: true,
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          slug: result.workspace.slug,
        },
      },
    });

    // 7. Attach secure httpOnly cookie
    setSessionCookie(response, rawToken);

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    console.error('[Signup Route] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create workspace account.' } },
      { status: 500 }
    );
  }
}
