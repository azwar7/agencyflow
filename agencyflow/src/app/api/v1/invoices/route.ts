import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

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
    return NextResponse.json({ success: false, error: error.message }, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession(req);
    // RBAC: Financial creation restricted to OWNER, ADMIN, MANAGER
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();

    // Validate companyId belongs strictly to authenticated workspace
    if (body.companyId) {
      const company = await prisma.company.findFirst({
        where: { id: body.companyId, workspaceId },
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
        companyId: body.companyId || null,
        number: `INV-2026-${randomNum}`,
        client: body.client || 'Client Account',
        amount: parseFloat(body.amount || '0'),
        status: body.status || 'PENDING',
        issuedDate: new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 86400000 * 14),
      },
    });

    return NextResponse.json({ success: true, data: newInvoice }, { status: 201 });
  } catch (err: any) {
    const isUnauthorized = err.message?.includes('Unauthorized') || err.message?.includes('session');
    const isForbidden = err.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message || 'Failed to create invoice' }, { status });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession(req);
    // RBAC: Payment status updates restricted to OWNER, ADMIN, MANAGER
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const workspaceId = session.workspaceId;
    const body = await req.json();

    await prisma.invoice.updateMany({
      where: { id: body.id, workspaceId },
      data: { status: body.status || 'PAID' },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const isUnauthorized = err.message?.includes('Unauthorized') || err.message?.includes('session');
    const isForbidden = err.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 400;
    return NextResponse.json({ success: false, error: err.message || 'Failed to update invoice' }, { status });
  }
}
