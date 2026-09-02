import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const updateProfileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100).optional(),
  phone: z.string().max(50).nullable().optional(),
  jobTitle: z.string().max(100).nullable().optional(),
  avatarUrl: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),

  // Personal Regional Overrides
  usePersonalPreferences: z.boolean().optional(),
  personalTimezone: z.string().max(50).nullable().optional(),
  personalDateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).nullable().optional(),
  personalTimeFormat: z.enum(['12h', '24h']).nullable().optional(),

  // Interface Preferences
  defaultLandingPage: z.string().min(1).max(50).optional(),
  defaultCrmView: z.enum(['kanban', 'table']).optional(),
  rememberFilters: z.boolean().optional(),
  sidebarCollapsed: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        jobTitle: true,
        usePersonalPreferences: true,
        personalTimezone: true,
        personalDateFormat: true,
        personalTimeFormat: true,
        defaultLandingPage: true,
        defaultCrmView: true,
        rememberFilters: true,
        sidebarCollapsed: true,
        workspace: {
          select: {
            timezone: true,
            dateFormat: true,
            timeFormat: true,
            currency: true,
          },
        },
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
    const validated = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(validated.fullName !== undefined ? { fullName: validated.fullName.trim() } : {}),
        ...(validated.phone !== undefined ? { phone: validated.phone || null } : {}),
        ...(validated.jobTitle !== undefined ? { jobTitle: validated.jobTitle || null } : {}),
        ...(validated.avatarUrl !== undefined ? { avatarUrl: validated.avatarUrl || null } : {}),
        ...(validated.usePersonalPreferences !== undefined ? { usePersonalPreferences: validated.usePersonalPreferences } : {}),
        ...(validated.personalTimezone !== undefined ? { personalTimezone: validated.personalTimezone || null } : {}),
        ...(validated.personalDateFormat !== undefined ? { personalDateFormat: validated.personalDateFormat || null } : {}),
        ...(validated.personalTimeFormat !== undefined ? { personalTimeFormat: validated.personalTimeFormat || null } : {}),
        ...(validated.defaultLandingPage !== undefined ? { defaultLandingPage: validated.defaultLandingPage } : {}),
        ...(validated.defaultCrmView !== undefined ? { defaultCrmView: validated.defaultCrmView } : {}),
        ...(validated.rememberFilters !== undefined ? { rememberFilters: validated.rememberFilters } : {}),
        ...(validated.sidebarCollapsed !== undefined ? { sidebarCollapsed: validated.sidebarCollapsed } : {}),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        phone: true,
        jobTitle: true,
        usePersonalPreferences: true,
        personalTimezone: true,
        personalDateFormat: true,
        personalTimeFormat: true,
        defaultLandingPage: true,
        defaultCrmView: true,
        rememberFilters: true,
        sidebarCollapsed: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Personal profile and preferences updated.',
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
      { success: false, error: { message: error.message || 'Failed to update preferences' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
