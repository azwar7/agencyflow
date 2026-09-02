import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100).optional(),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric with hyphens').optional(),
  logoUrl: z.string().url('Invalid URL format').nullable().optional().or(z.literal('')),
  website: z.string().nullable().optional().or(z.literal('')),
  industry: z.string().max(100).nullable().optional(),
  companySize: z.string().max(50).nullable().optional(),
  businessEmail: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  businessPhone: z.string().max(50).nullable().optional(),
  businessAddress: z.string().max(255).nullable().optional(),

  // Regional
  timezone: z.string().min(1).max(50).optional(),
  language: z.string().min(2).max(10).optional(),
  dateFormat: z.enum(['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  currency: z.string().min(3).max(5).optional(),
  additionalCurrencies: z.array(z.string()).optional(),
  numberFormat: z.enum(['standard', 'european']).optional(),
  firstDayOfWeek: z.number().min(0).max(6).optional(),

  // Business Calendar
  workingDays: z.array(z.number().min(0).max(6)).optional(),
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM').optional(),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format must be HH:MM').optional(),
  holidays: z.array(z.object({ date: z.string(), name: z.string() })).optional(),

  // Fiscal
  fiscalYearStartMonth: z.number().min(1).max(12).optional(),
  fiscalYearType: z.enum(['standard', 'custom']).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: {
        id: true,
        name: true,
        slug: true,
        persona: true,
        logoUrl: true,
        website: true,
        industry: true,
        companySize: true,
        businessEmail: true,
        businessPhone: true,
        businessAddress: true,
        timezone: true,
        language: true,
        dateFormat: true,
        timeFormat: true,
        currency: true,
        additionalCurrencies: true,
        numberFormat: true,
        firstDayOfWeek: true,
        workingDays: true,
        workingHoursStart: true,
        workingHoursEnd: true,
        holidays: true,
        fiscalYearStartMonth: true,
        fiscalYearType: true,
      },
    });

    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: workspace });
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
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = updateWorkspaceSchema.parse(body);

    // If slug changed, ensure uniqueness
    if (validated.slug) {
      const existingSlug = await prisma.workspace.findFirst({
        where: {
          slug: validated.slug,
          NOT: { id: session.workspaceId },
        },
      });

      if (existingSlug) {
        return NextResponse.json(
          { success: false, error: { message: 'This workspace slug is already in use.' } },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.workspace.update({
      where: { id: session.workspaceId },
      data: {
        ...(validated.name !== undefined ? { name: validated.name.trim() } : {}),
        ...(validated.slug !== undefined ? { slug: validated.slug.trim() } : {}),
        ...(validated.logoUrl !== undefined ? { logoUrl: validated.logoUrl || null } : {}),
        ...(validated.website !== undefined ? { website: validated.website || null } : {}),
        ...(validated.industry !== undefined ? { industry: validated.industry || null } : {}),
        ...(validated.companySize !== undefined ? { companySize: validated.companySize || null } : {}),
        ...(validated.businessEmail !== undefined ? { businessEmail: validated.businessEmail || null } : {}),
        ...(validated.businessPhone !== undefined ? { businessPhone: validated.businessPhone || null } : {}),
        ...(validated.businessAddress !== undefined ? { businessAddress: validated.businessAddress || null } : {}),
        ...(validated.timezone !== undefined ? { timezone: validated.timezone } : {}),
        ...(validated.language !== undefined ? { language: validated.language } : {}),
        ...(validated.dateFormat !== undefined ? { dateFormat: validated.dateFormat } : {}),
        ...(validated.timeFormat !== undefined ? { timeFormat: validated.timeFormat } : {}),
        ...(validated.currency !== undefined ? { currency: validated.currency } : {}),
        ...(validated.additionalCurrencies !== undefined ? { additionalCurrencies: validated.additionalCurrencies } : {}),
        ...(validated.numberFormat !== undefined ? { numberFormat: validated.numberFormat } : {}),
        ...(validated.firstDayOfWeek !== undefined ? { firstDayOfWeek: validated.firstDayOfWeek } : {}),
        ...(validated.workingDays !== undefined ? { workingDays: validated.workingDays } : {}),
        ...(validated.workingHoursStart !== undefined ? { workingHoursStart: validated.workingHoursStart } : {}),
        ...(validated.workingHoursEnd !== undefined ? { workingHoursEnd: validated.workingHoursEnd } : {}),
        ...(validated.holidays !== undefined ? { holidays: validated.holidays } : {}),
        ...(validated.fiscalYearStartMonth !== undefined ? { fiscalYearStartMonth: validated.fiscalYearStartMonth } : {}),
        ...(validated.fiscalYearType !== undefined ? { fiscalYearType: validated.fiscalYearType } : {}),
      },
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        workspaceId: session.workspaceId,
        userId: session.userId,
        type: 'NOTE',
        content: `Updated workspace configuration settings.`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace settings saved successfully.',
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
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to update workspace settings' } },
      { status }
    );
  }
}
