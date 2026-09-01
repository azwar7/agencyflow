import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createSession, setSessionCookie } from '@/lib/auth-session';
import { hashPassword } from '@/lib/password';

const verifyAndSignupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  otpCode: z.string().length(6, 'Verification code must be 6 digits'),
  persona: z.enum(['AGENCY', 'FREELANCER']).default('AGENCY'),
  workspaceName: z.string().min(1, 'Workspace name is required').max(100),
  niche: z.string().optional(),
  targetRevenue: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = verifyAndSignupSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    // 1. Verify OTP code in database
    const verification = await prisma.emailVerification.findFirst({
      where: {
        email: emailNormalized,
        otpCode: validated.otpCode.trim(),
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { success: false, error: { message: 'Invalid or expired 6-digit verification code. Please request a new one.' } },
        { status: 400 }
      );
    }

    // 2. Check if user already registered during the OTP process
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'An account with this email address already exists. Please log in.' } },
        { status: 400 }
      );
    }

    // 3. Clean up OTP record once verified
    await prisma.emailVerification.deleteMany({
      where: { email: emailNormalized },
    });

    // 4. Generate clean slug
    const baseSlug = validated.workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug || (validated.persona === 'FREELANCER' ? 'freelancer' : 'agency')}-${randomSuffix}`;

    // 5. Real cryptographic password hash
    const passwordHash = await hashPassword(validated.password);

    // 6. Atomic database creation (Zero State — Pure clean workspace with 0 dummy data)
    const result = await prisma.$transaction(
      async (tx) => {
        const workspace = await tx.workspace.create({
          data: {
            name: validated.workspaceName.trim(),
            slug,
            persona: validated.persona,
            niche: validated.niche || null,
            targetRevenue: validated.targetRevenue || null,
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
      { maxWait: 15000, timeout: 30000 }
    );

    // 7. Create database-backed session
    const { rawToken } = await createSession(result.user.id);

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
          persona: result.workspace.persona,
          isFirstLogin: true,
        },
        workspace: {
          id: result.workspace.id,
          name: result.workspace.name,
          slug: result.workspace.slug,
          persona: result.workspace.persona,
        },
      },
    });

    // 8. Attach secure httpOnly cookie
    setSessionCookie(response, rawToken);

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to complete registration.' } },
      { status: 500 }
    );
  }
}
