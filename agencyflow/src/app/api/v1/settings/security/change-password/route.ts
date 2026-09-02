import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { verifyPassword, hashPassword } from '@/lib/password';
import { logAuditEvent } from '@/lib/audit';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // 1. Fetch user password hash and workspace security policies
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        workspace: {
          select: {
            minPasswordLength: true,
            requirePasswordNumbers: true,
            requirePasswordSymbols: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: { message: 'User not found' } }, { status: 404 });
    }

    // 2. Validate current password
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: { message: 'Current password is incorrect.' } },
        { status: 400 }
      );
    }

    // 3. Enforce workspace security policies on new password
    const policy = user.workspace;
    if (newPassword.length < policy.minPasswordLength) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `New password does not meet workspace policy (minimum ${policy.minPasswordLength} characters).`,
          },
        },
        { status: 400 }
      );
    }

    if (policy.requirePasswordNumbers && !/\d/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Workspace policy requires password to contain at least one numeric digit.' },
        },
        { status: 400 }
      );
    }

    if (policy.requirePasswordSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'Workspace policy requires password to contain at least one special character/symbol.' },
        },
        { status: 400 }
      );
    }

    // 4. Hash new password and persist
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newHash },
    });

    // 5. Log audit event
    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'PASSWORD_CHANGE',
      entityType: 'User',
      entityId: session.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: error.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update password' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
