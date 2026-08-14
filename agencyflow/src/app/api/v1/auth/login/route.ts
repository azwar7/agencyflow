import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { encodeSession, SESSION_COOKIE_NAME, AUTH_COOKIE_NAME } from '@/lib/auth-session';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    // Look up user
    let user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      include: { workspace: true },
    });

    // If demo account and user doesn't exist yet, check or attach to seed workspace
    if (!user) {
      const demoWorkspace = await prisma.workspace.findFirst({
        include: { users: true },
      });

      if (demoWorkspace) {
        user = await prisma.user.create({
          data: {
            workspaceId: demoWorkspace.id,
            email: emailNormalized,
            fullName: 'Alex Sterling',
            role: 'OWNER',
            passwordHash: 'seeded_demo_hash',
          },
          include: { workspace: true },
        });
      } else {
        return NextResponse.json(
          { success: false, error: { message: 'Invalid credentials. User not found.' } },
          { status: 401 }
        );
      }
    }

    const sessionPayload = {
      userId: user.id,
      workspaceId: user.workspaceId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      agencyName: user.workspace.name,
      isFirstLogin: false,
    };

    const token = encodeSession(sessionPayload);

    const response = NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          agency: user.workspace.name,
          workspaceId: user.workspaceId,
          isFirstLogin: false,
        },
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
      httpOnly: false,
    });

    response.cookies.set(AUTH_COOKIE_NAME, 'true', {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Login failed.' } },
      { status: 400 }
    );
  }
}
