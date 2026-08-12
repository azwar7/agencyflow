import { NextResponse } from 'next/server';

export async function GET() {
  const sampleDeliverables = [
    { id: 'del-1', title: 'TechFlow Cloud Portal Specs', client: 'TechFlow Systems', status: 'IN_REVIEW', dueDate: 'Aug 18, 2026' },
    { id: 'del-2', title: 'Elevate DTC Brand Kit', client: 'Elevate Creative Co.', status: 'APPROVED', dueDate: 'Aug 12, 2026' },
    { id: 'del-3', title: 'Summit Tracking Dashboard MVP', client: 'Summit Logistics', status: 'IN_PROGRESS', dueDate: 'Aug 25, 2026' },
  ];
  return NextResponse.json({ success: true, data: sampleDeliverables });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newDeliverable = {
      id: `del-${Date.now()}`,
      title: body.title || 'Untitled Deliverable',
      client: body.client || 'General Client',
      status: 'IN_PROGRESS',
      dueDate: 'Aug 2026',
    };
    return NextResponse.json({ success: true, data: newDeliverable });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to create deliverable' }, { status: 500 });
  }
}
