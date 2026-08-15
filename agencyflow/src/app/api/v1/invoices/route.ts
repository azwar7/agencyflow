import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

const createInvoiceSchema = z.object({
  companyId: z.string().optional().nullable(),
  client: z.string().min(1, 'Client name is required').max(255).optional().default('Client Account'),
  amount: z.coerce
    .number()
    .min(0, 'Invoice amount cannot be negative')
    .max(100_000_000, 'Invoice amount exceeds maximum allowed limit')
    .optional()
    .default(0),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE']).optional().default('PENDING'),
  dueDate: z.string().optional().nullable(),
});

const patchInvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE']).optional().default('PAID'),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    const invoices = await prisma.invoice.findMany({
      where: { workspaceId },
      orderBy: { issuedDate: 'desc' },
    });

    const formatted = invoices.map((inv) => ({
      id: inv.number || inv.id,
      realId: inv.id,
      client: inv.client,
      amount: inv.amount,
      issued: inv.issuedDate.toISOString().split('T')[0],
      due: inv.dueDate.toISOString().split('T')[0],
      status: inv.status as any,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;
    return NextResponse.json({ success: false, error: { message: error.message } }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    // RBAC: Financial creation restricted to OWNER, ADMIN, MANAGER
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = createInvoiceSchema.parse(body);

    // Validate companyId belongs strictly to authenticated workspace
    if (validated.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: validated.companyId, workspaceId },
      });
      if (!company) {
        return NextResponse.json(
          { success: false, error: { message: 'Referenced company does not exist in this workspace.' } },
          { status: 400 }
        );
      }
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newInvoice = await prisma.invoice.create({
      data: {
        workspaceId,
        companyId: validated.companyId || null,
        number: `INV-2026-${randomNum}`,
        client: validated.client.trim(),
        amount: validated.amount,
        status: validated.status,
        issuedDate: new Date(),
        dueDate: validated.dueDate ? new Date(validated.dueDate) : new Date(Date.now() + 86400000 * 14),
      },
    });

    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: err.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = err.message?.includes('Unauthorized') || err.message?.includes('session');
    const isForbidden = err.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: { message: err.message || 'Failed to create invoice' } }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession(req);
    // RBAC: Payment status updates restricted to OWNER, ADMIN, MANAGER
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = patchInvoiceSchema.parse(body);

    const updateResult = await prisma.invoice.updateMany({
      where: { id: validated.id, workspaceId },
      data: { status: validated.status },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Invoice not found or does not belong to this workspace.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { message: err.errors[0]?.message || 'Validation error' } },
        { status: 400 }
      );
    }
    const isUnauthorized = err.message?.includes('Unauthorized') || err.message?.includes('session');
    const isForbidden = err.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: { message: err.message || 'Failed to update invoice' } }, { status });
  }
}
