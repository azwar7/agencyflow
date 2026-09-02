import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

const updateNotificationsSchema = z.object({
  notifyEmailDeals: z.boolean().optional(),
  notifyEmailTasks: z.boolean().optional(),
  notifyEmailProposals: z.boolean().optional(),
  notifyEmailInvoices: z.boolean().optional(),
  notifyInAppDeals: z.boolean().optional(),
  notifyInAppTasks: z.boolean().optional(),
  notifyInAppProposals: z.boolean().optional(),
  notifyInAppInvoices: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        notifyEmailDeals: true,
        notifyEmailTasks: true,
        notifyEmailProposals: true,
        notifyEmailInvoices: true,
        notifyInAppDeals: true,
        notifyInAppTasks: true,
        notifyInAppProposals: true,
        notifyInAppInvoices: true,
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
    const validated = updateNotificationsSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(validated.notifyEmailDeals !== undefined ? { notifyEmailDeals: validated.notifyEmailDeals } : {}),
        ...(validated.notifyEmailTasks !== undefined ? { notifyEmailTasks: validated.notifyEmailTasks } : {}),
        ...(validated.notifyEmailProposals !== undefined ? { notifyEmailProposals: validated.notifyEmailProposals } : {}),
        ...(validated.notifyEmailInvoices !== undefined ? { notifyEmailInvoices: validated.notifyEmailInvoices } : {}),
        ...(validated.notifyInAppDeals !== undefined ? { notifyInAppDeals: validated.notifyInAppDeals } : {}),
        ...(validated.notifyInAppTasks !== undefined ? { notifyInAppTasks: validated.notifyInAppTasks } : {}),
        ...(validated.notifyInAppProposals !== undefined ? { notifyInAppProposals: validated.notifyInAppProposals } : {}),
        ...(validated.notifyInAppInvoices !== undefined ? { notifyInAppInvoices: validated.notifyInAppInvoices } : {}),
      },
      select: {
        notifyEmailDeals: true,
        notifyEmailTasks: true,
        notifyEmailProposals: true,
        notifyEmailInvoices: true,
        notifyInAppDeals: true,
        notifyInAppTasks: true,
        notifyInAppProposals: true,
        notifyInAppInvoices: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences saved.',
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
      { success: false, error: { message: error.message || 'Failed to update notifications' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
