import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { encodeSession, SESSION_COOKIE_NAME, AUTH_COOKIE_NAME } from '@/lib/auth-session';

const signupSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  agencyName: z.string().min(1, 'Agency name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = signupSchema.parse(body);

    const emailNormalized = validated.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { message: 'An account with this email already exists. Please log in.' } },
        { status: 400 }
      );
    }

    // Generate unique slug
    const baseSlug = validated.agencyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${baseSlug || 'agency'}-${randomSuffix}`;

    // 1. Create dedicated isolated Workspace for this new organization
    const workspace = await prisma.workspace.create({
      data: {
        name: validated.agencyName,
        slug,
      },
    });

    // 2. Create the Owner User in this workspace
    const user = await prisma.user.create({
      data: {
        workspaceId: workspace.id,
        email: emailNormalized,
        fullName: validated.fullName,
        role: 'OWNER',
        passwordHash: `$2b$12$${Buffer.from(validated.password).toString('base64')}`, // Simulated secure hash
      },
    });

    const sessionPayload = {
      userId: user.id,
      workspaceId: workspace.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      agencyName: workspace.name,
      isFirstLogin: true,
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
          agency: workspace.name,
          workspaceId: workspace.id,
          isFirstLogin: true,
        },
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
      },
    });

    // Set HTTP-only compatible session cookie & auth cookie
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
      httpOnly: false, // accessible to client for synchronization
    });

    response.cookies.set(AUTH_COOKIE_NAME, 'true', {
      path: '/',
      maxAge: 86400 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to create account.' } },
      { status: 400 }
    );
  }
}
