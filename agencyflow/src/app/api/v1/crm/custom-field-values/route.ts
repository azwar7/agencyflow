import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const entityType = searchParams.get('entityType');

    if (!recordId) {
      return NextResponse.json({ success: false, error: { message: 'recordId is required' } }, { status: 400 });
    }

    // Fetch field definitions for this entityType
    const fields = await prisma.customField.findMany({
      where: {
        workspaceId: session.workspaceId,
        ...(entityType ? { entityType: entityType.toUpperCase() } : {}),
      },
      orderBy: { order: 'asc' },
    });

    // Fetch existing values for this recordId
    const values = await prisma.customFieldValue.findMany({
      where: {
        workspaceId: session.workspaceId,
        recordId,
      },
      include: { customField: true },
    });

    const valueMap: Record<string, any> = {};
    for (const v of values) {
      const type = v.customField.fieldType;
      if (type === 'NUMBER' || type === 'CURRENCY') {
        valueMap[v.customField.key] = v.numberValue;
      } else if (type === 'DATE') {
        valueMap[v.customField.key] = v.dateValue ? v.dateValue.toISOString().split('T')[0] : null;
      } else if (type === 'CHECKBOX') {
        valueMap[v.customField.key] = v.booleanValue ?? false;
      } else if (type === 'MULTI_SELECT') {
        valueMap[v.customField.key] = v.jsonValue || [];
      } else {
        valueMap[v.customField.key] = v.textValue || '';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fields,
        values: valueMap,
      },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to fetch field values' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    const body = await request.json();
    const { recordId, entityType, values } = body;

    if (!recordId || !entityType || typeof values !== 'object') {
      return NextResponse.json(
        { success: false, error: { message: 'recordId, entityType, and values object are required' } },
        { status: 400 }
      );
    }

    // Fetch all active custom fields for this workspace and entityType
    const customFields = await prisma.customField.findMany({
      where: {
        workspaceId: session.workspaceId,
        entityType: entityType.toUpperCase(),
      },
    });

    const fieldMap = new Map(customFields.map((f) => [f.key, f]));

    // Upsert each field value
    for (const [key, val] of Object.entries(values)) {
      const field = fieldMap.get(key);
      if (!field) continue;

      let textValue: string | null = null;
      let numberValue: number | null = null;
      let dateValue: Date | null = null;
      let booleanValue: boolean | null = null;
      let jsonValue: any = null;

      if (field.fieldType === 'NUMBER' || field.fieldType === 'CURRENCY') {
        numberValue = val !== null && val !== undefined && val !== '' ? Number(val) : null;
      } else if (field.fieldType === 'DATE') {
        dateValue = val ? new Date(val as any) : null;
      } else if (field.fieldType === 'CHECKBOX') {
        booleanValue = Boolean(val);
      } else if (field.fieldType === 'MULTI_SELECT') {
        jsonValue = Array.isArray(val) ? val : [];
      } else {
        textValue = val !== null && val !== undefined ? String(val) : null;
      }

      await prisma.customFieldValue.upsert({
        where: {
          customFieldId_recordId: {
            customFieldId: field.id,
            recordId,
          },
        },
        create: {
          workspaceId: session.workspaceId,
          customFieldId: field.id,
          recordId,
          textValue,
          numberValue,
          dateValue,
          booleanValue,
          jsonValue,
        },
        update: {
          textValue,
          numberValue,
          dateValue,
          booleanValue,
          jsonValue,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Custom field values saved successfully.',
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to save field values' } },
      { status: isUnauthorized ? 401 : 500 }
    );
  }
}
