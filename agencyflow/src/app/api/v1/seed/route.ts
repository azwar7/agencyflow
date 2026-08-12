import { NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seedData';

export async function POST() {
  try {
    const result = await seedDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully with Apex Digital Agency sample data.',
      data: { workspace: result.workspace.name },
    });
  } catch (error: any) {
    console.error('Seed Error:', error);
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to seed database.' } },
      { status: 500 }
    );
  }
}
