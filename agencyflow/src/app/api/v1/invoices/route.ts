import { NextResponse } from 'next/server';

export async function GET() {
  const sampleInvoices = [
    { id: 'inv-001', number: 'INV-2026-001', client: 'Elevate Creative Co.', amount: '$18,000', status: 'PAID', dueDate: 'Aug 01, 2026' },
    { id: 'inv-002', number: 'INV-2026-002', client: 'TechFlow Systems', amount: '$12,500', status: 'UNPAID', dueDate: 'Aug 15, 2026' },
    { id: 'inv-003', number: 'INV-2026-003', client: 'Summit Logistics', amount: '$9,500', status: 'OVERDUE', dueDate: 'Jul 28, 2026' },
  ];
  return NextResponse.json({ success: true, data: sampleInvoices });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newInvoice = {
      id: `inv-${Date.now()}`,
      number: `INV-2026-00${Math.floor(Math.random() * 90) + 10}`,
      client: body.client || 'Client Account',
      amount: `$${Number(body.amount || 10000).toLocaleString()}`,
      status: 'UNPAID',
      dueDate: 'Aug 30, 2026',
    };
    return NextResponse.json({ success: true, data: newInvoice });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ success: true, data: { id: body.id, status: body.status || 'PAID' } });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to update invoice' }, { status: 500 });
  }
}
