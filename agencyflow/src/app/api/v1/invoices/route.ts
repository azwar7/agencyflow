import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

const createInvoiceSchema = z.object({
  companyId: z.string().optional().nullable(),
  client: z.string().min(1, 'Client name is required').max(255).default('Client Account'),
  amount: z.coerce
    .number()
    .min(0, 'Invoice amount cannot be negative')
    .max(100_000_000, 'Invoice amount exceeds maximum allowed limit')
    .default(12000),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE']).default('PENDING'),
  dueDate: z.string().optional().nullable(),
});

const patchInvoiceSchema = z.object({
  id: z.string().min(1, 'Invoice ID is required'),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE']).optional(),
  amount: z.coerce.number().optional(),
  client: z.string().optional(),
  dueDate: z.string().optional().nullable(),
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
      amountFormatted: `$${inv.amount.toLocaleString()}`,
      issued: inv.issuedDate.toISOString().split('T')[0],
      due: inv.dueDate.toISOString().split('T')[0],
      status: inv.status as 'PAID' | 'PENDING' | 'OVERDUE',
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
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = createInvoiceSchema.parse(body);

    const randomNum = Math.floor(100 + Math.random() * 900);
    const newInvoice = await prisma.invoice.create({
      data: {
        workspaceId,
        companyId: validated.companyId || null,
        number: `INV-${new Date().getFullYear()}-${randomNum}`,
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
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();
    const validated = patchInvoiceSchema.parse(body);

    const updateData: any = {};
    if (validated.status !== undefined) updateData.status = validated.status;
    if (validated.amount !== undefined) updateData.amount = validated.amount;
    if (validated.client !== undefined) updateData.client = validated.client;
    if (validated.dueDate !== undefined) updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : undefined;

    const updateResult = await prisma.invoice.updateMany({
      where: {
        workspaceId,
        OR: [{ id: validated.id }, { number: validated.id }],
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'Invoice not found or does not belong to this workspace.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Invoice updated successfully' });
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

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || searchParams.get('number');

    if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

    await prisma.invoice.deleteMany({
      where: {
        workspaceId,
        OR: [{ id }, { number: id }],
      },
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
