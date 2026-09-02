import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';
import { logAuditEvent } from '@/lib/audit';

const createApiKeySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_REP', 'VIEWER']).default('ADMIN'),
});

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: session.workspaceId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        role: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: keys });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER', 'ADMIN']);

    const body = await request.json();
    const validated = createApiKeySchema.parse(body);

    // Generate cryptographically secure API key
    // Prefix: af_live_ + 32 random hex characters (128-bit entropy)
    const randomHex = crypto.randomBytes(16).toString('hex');
    const rawKey = `af_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 14) + '...';

    // Compute SHA-256 hash (never store plaintext)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const created = await prisma.apiKey.create({
      data: {
        workspaceId: session.workspaceId,
        name: validated.name.trim(),
        role: validated.role,
        keyPrefix,
        keyHash,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        role: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      workspaceId: session.workspaceId,
      userId: session.userId,
      action: 'API_KEY_CREATE',
      entityType: 'ApiKey',
      entityId: created.id,
      metadata: { name: created.name, keyPrefix, role: created.role },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'API key generated. Copy this key now; it cannot be shown again.',
        data: {
          ...created,
          rawKey, // Returned exactly once
        },
      },
      { status: 201 }
    );
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
      { success: false, error: { message: error.message || 'Failed to create API key' } },
      { status: isUnauthorized ? 401 : isForbidden ? 403 : 500 }
    );
  }
}
