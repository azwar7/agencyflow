import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const updateAppearanceSchema = z.object({
  theme: z.enum(['system', 'dark', 'light']).optional(),
  density: z.enum(['comfortable', 'compact']).optional(),
  reducedMotion: z.boolean().optional(),
  textSize: z.enum(['normal', 'large']).optional(),
  highContrast: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        theme: true,
        density: true,
        reducedMotion: true,
        textSize: true,
        highContrast: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthSession(request);
    const body = await request.json();
    const validated = updateAppearanceSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(validated.theme !== undefined ? { theme: validated.theme } : {}),
        ...(validated.density !== undefined ? { density: validated.density } : {}),
        ...(validated.reducedMotion !== undefined ? { reducedMotion: validated.reducedMotion } : {}),
        ...(validated.textSize !== undefined ? { textSize: validated.textSize } : {}),
        ...(validated.highContrast !== undefined ? { highContrast: validated.highContrast } : {}),
      },
      select: {
        theme: true,
        density: true,
        reducedMotion: true,
        textSize: true,
        highContrast: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Appearance preferences updated.',
      data: updated,
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
      { success: false, error: { message: error.message || 'Failed to update appearance' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
