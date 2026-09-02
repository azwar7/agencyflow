import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const importRowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional().default(''),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  source: z.string().optional().default('CSV Import'),
});

const importRequestSchema = z.object({
  entity: z.enum(['LEAD', 'CONTACT']).default('LEAD'),
  rows: z.array(z.record(z.any())).min(1, 'No data rows provided for import'),
});

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN', 'MANAGER']);

    const body = await request.json();
    const validated = importRequestSchema.parse(body);

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.workspaceId },
      select: { duplicateLeadDetection: true, defaultLeadOwnerId: true },
    });

    const duplicateDetection = workspace?.duplicateLeadDetection || 'EMAIL_AND_PHONE';
    const defaultOwnerId = workspace?.defaultLeadOwnerId || session.userId;

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];

    for (let i = 0; i < validated.rows.length; i++) {
      const rawRow = validated.rows[i];
      try {
        const parsed = importRowSchema.parse({
          firstName: rawRow.firstName || rawRow['First Name'] || rawRow['first_name'] || '',
          lastName: rawRow.lastName || rawRow['Last Name'] || rawRow['last_name'] || '',
          email: (rawRow.email || rawRow['Email'] || rawRow['email_address'] || '').toLowerCase().trim(),
          phone: rawRow.phone || rawRow['Phone'] || rawRow['phone_number'] || '',
          companyName: rawRow.companyName || rawRow['Company'] || rawRow['company_name'] || '',
          source: rawRow.source || rawRow['Source'] || 'CSV Import',
        });

        // Check duplicate protection
        if (duplicateDetection !== 'OFF') {
          const existingLead = await prisma.lead.findFirst({
            where: {
              workspaceId: session.workspaceId,
              email: parsed.email,
            },
          });

          if (existingLead) {
            duplicateCount++;
            continue;
          }
        }

        // Ingest Lead
        await prisma.lead.create({
          data: {
            workspaceId: session.workspaceId,
            assignedToId: defaultOwnerId,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            email: parsed.email,
            phone: parsed.phone || null,
            companyName: parsed.companyName || null,
            source: parsed.source,
            status: 'NEW',
          },
        });

        importedCount++;
      } catch (rowErr: any) {
        errorCount++;
        if (errorDetails.length < 5) {
          errorDetails.push(`Row ${i + 1}: ${rowErr.message}`);
        }
      }
    }

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'DATA_IMPORT',
      entityType: validated.entity,
      metadata: {
        totalRows: validated.rows.length,
        importedCount,
        duplicateCount,
        errorCount,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Import complete: ${importedCount} records created, ${duplicateCount} duplicates skipped, ${errorCount} errors.`,
      data: {
        totalRows: validated.rows.length,
        importedCount,
        duplicateCount,
        errorCount,
        errorDetails,
      },
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
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Import failed' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
