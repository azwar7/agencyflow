import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedData';
import { getAuthSession } from '@/lib/auth-session';
import { requireRole } from '@/lib/authorization';

export async function POST(request: Request) {
  try {
    // 1. Strict environment guard: Disable global seed endpoint in production
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: { message: 'Database seeding endpoint is disabled in production.' } },
        { status: 404 }
      );
    }

    // 2. Strict Authentication & Role Guard: Only authenticated OWNER can trigger development re-seed
    const session = await getAuthSession(request);
    requireRole(session, ['OWNER']);

    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with Apex Digital Agency sample data.',
      data: { workspace: result.workspace.name },
    });
  } catch (error: any) {
    const isUnauthorized = error.message?.includes('Unauthorized') || error.message?.includes('session');
    const isForbidden = error.message?.includes('Forbidden');
    const status = isUnauthorized ? 401 : isForbidden ? 403 : 500;

    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to seed database.' } },
      { status }
    );
  }
}
