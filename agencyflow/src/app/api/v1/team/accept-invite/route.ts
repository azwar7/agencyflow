import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashToken, createSession, setSessionCookie } from '@/lib/auth-session';
import { hashPassword } from '@/lib/password';

const acceptInviteSchema = z.object({
  token: z.string().min(10, 'Invitation token is required'),
  fullName: z.string().min(1, 'Full name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = acceptInviteSchema.parse(body);

    const tokenHash = hashToken(validated.token);

    // 1. Look up invitation by SHA-256 hash (never compare against raw token)
    const invitation = await prisma.invitation.findUnique({
      where: { tokenHash },
      include: { workspace: true },
    });

    // 2. Generic rejection for non-existent, expired, or previously accepted tokens
    const genericInvalidError = {
      success: false,
      error: { message: 'Invalid, expired, or already used invitation token.' },
    };

    if (!invitation || invitation.acceptedAt !== null || invitation.expiresAt < new Date()) {
      return NextResponse.json(genericInvalidError, { status: 400 });
    }

    // 3. Hash the user-chosen password with bcrypt (12 rounds)
    const passwordHash = await hashPassword(validated.password);

    // 4. Atomic transaction: create user and mark invitation consumed
    const result = await prisma.$transaction(async (tx) => {
      // Ensure email has not been registered since invitation was dispatched
      const existingUser = await tx.user.findUnique({
        where: { email: invitation.email },
      });

      if (existingUser) {
        throw new Error('An account with this email address already exists.');
      }

      // Create new tenant user with approved invitation role
      const user = await tx.user.create({
        data: {
          workspaceId: invitation.workspaceId,
          email: invitation.email,
          fullName: validated.fullName.trim(),
          role: invitation.role,
          passwordHash,
        },
      });

      // Mark single-use invitation consumed
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      return user;
    });

    // 5. Establish secure database-backed session for accepted member
    const { rawToken: sessionRawToken } = await createSession(result.id);

    const response = NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully. Welcome to your team workspace.',
      data: {
        user: {
          id: result.id,
          email: result.email,
          name: result.fullName,
          role: result.role,
          agency: invitation.workspace.name,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    // 6. Attach httpOnly session cookie
    setSessionCookie(response, sessionRawToken);

    return response;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to accept invitation.' } },
      { status: 400 }
    );
  }
}
