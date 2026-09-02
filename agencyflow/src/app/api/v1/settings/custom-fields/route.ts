import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const createCustomFieldSchema = z.object({
  entityType: z.enum(['LEAD', 'CONTACT', 'COMPANY', 'DEAL']),
  name: z.string().min(1, 'Field name is required').max(60),
  key: z.string().optional(),
  fieldType: z.enum([
    'TEXT',
    'LONG_TEXT',
    'NUMBER',
    'CURRENCY',
    'DATE',
    'DROPDOWN',
    'MULTI_SELECT',
    'CHECKBOX',
    'URL',
  ]),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  isRequired: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');

    const fields = await prisma.customField.findMany({
      where: {
        workspaceId: session.workspaceId,
        ...(entityType ? { entityType: entityType.toUpperCase() } : {}),
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ success: true, data: fields });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = createCustomFieldSchema.parse(body);

    const generatedKey = (validated.key || validated.name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '');

    // Check if key exists for this entityType in workspace
    const existing = await prisma.customField.findFirst({
      where: {
        workspaceId: session.workspaceId,
        entityType: validated.entityType,
        key: generatedKey,
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: { message: `A field with key '${generatedKey}' already exists for ${validated.entityType}.` } },
        { status: 400 }
      );
    }

    const fieldCount = await prisma.customField.count({
      where: {
        workspaceId: session.workspaceId,
        entityType: validated.entityType,
      },
    });

    const field = await prisma.customField.create({
      data: {
        workspaceId: session.workspaceId,
        entityType: validated.entityType,
        name: validated.name.trim(),
        key: generatedKey,
        fieldType: validated.fieldType,
        options: validated.options || undefined,
        placeholder: validated.placeholder || undefined,
        description: validated.description || undefined,
        isRequired: validated.isRequired,
        order: fieldCount,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'CUSTOM_FIELD_CREATE',
      entityType: 'CustomField',
      entityId: field.id,
      metadata: { name: field.name, key: field.key, entityType: field.entityType, fieldType: field.fieldType },
    });

    return NextResponse.json({
      success: true,
      message: `Custom field '${field.name}' created for ${field.entityType}.`,
      data: field,
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
      { success: false, error: { message: error.message || 'Failed to create custom field' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
