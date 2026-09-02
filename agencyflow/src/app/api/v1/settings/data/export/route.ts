import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || 'leads';
    const format = searchParams.get('format') || 'csv';

    // 1. RBAC Check: Viewers are strictly denied export permissions
    if (session.role === 'VIEWER') {
      return NextResponse.json(
        { success: false, error: { message: 'Viewer role does not have permission to export workspace data.' } },
        { status: 403 }
      );
    }

    // 2. Build tenant and role-isolated filter
    // Admins and Owners export all records; Sales Reps export only their assigned records
    const isRestrictedRole = session.role === 'SALES_REP';
    const baseWhere: any = { workspaceId: session.workspaceId };
    if (isRestrictedRole) {
      baseWhere.assignedToId = session.userId;
    }

    let records: any[] = [];
    let filename = `AgencyFlow_${entity}_${new Date().toISOString().split('T')[0]}`;

    if (entity === 'leads') {
      records = await prisma.lead.findMany({
        where: baseWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          companyName: true,
          status: true,
          leadScore: true,
          source: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (entity === 'contacts') {
      records = await prisma.contact.findMany({
        where: { workspaceId: session.workspaceId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (entity === 'deals') {
      records = await prisma.deal.findMany({
        where: baseWhere,
        select: {
          id: true,
          title: true,
          value: true,
          stage: true,
          expectedCloseDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (entity === 'tasks') {
      records = await prisma.task.findMany({
        where: baseWhere,
        select: {
          id: true,
          title: true,
          priority: true,
          status: true,
          dueDate: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return NextResponse.json(
        { success: false, error: { message: `Unsupported export entity "${entity}"` } },
        { status: 400 }
      );
    }

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'DATA_EXPORT',
      entityType: entity.toUpperCase(),
      metadata: { recordCount: records.length, format, role: session.role },
    });

    // 3. Format output
    if (format === 'json') {
      return new NextResponse(JSON.stringify(records, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }

    // Format as CSV
    if (records.length === 0) {
      return new NextResponse('No records found', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    const headers = Object.keys(records[0]);
    const csvRows = [
      headers.join(','),
      ...records.map((r) =>
        headers
          .map((h) => {
            const val = r[h] !== null && r[h] !== undefined ? String(r[h]) : '';
            return `"${val.replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ];

    return new NextResponse(csvRows.join('\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Export failed' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
