import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const defaultProjects = [
  {
    id: 'proj-1',
    clientName: 'TechFlow Systems',
    title: 'TechFlow Cloud Portal Re-architecture',
    status: 'ON TRACK',
    statusType: 'success',
    progress: 68,
    nextMilestone: 'Phase 3 API Security Audit',
    dueDate: 'Aug 18, 2026',
    team: [
      { name: 'Sarah Jenkins', avatar: 'SJ', role: 'Lead Architect', color: 'var(--primary)' },
      { name: 'Alex Rivera', avatar: 'AR', role: 'Senior Frontend Dev', color: 'var(--secondary)' },
    ],
    budget: '$48,000',
    deliverables: [
      { id: 'd-1', title: 'Initial Architecture Blueprint & DB Schema', status: 'COMPLETED', date: 'Aug 05, 2026' },
      { id: 'd-2', title: 'Next.js 16 Glassmorphism Interface Setup', status: 'COMPLETED', date: 'Aug 10, 2026' },
      { id: 'd-3', title: 'Phase 3 API Security Audit & Pen Testing', status: 'IN_PROGRESS', date: 'Aug 18, 2026' },
      { id: 'd-4', title: 'Production Deployment & Load Testing', status: 'PENDING', date: 'Aug 25, 2026' },
    ],
    milestones: [
      { id: 'm-1', title: 'Discovery & System Design', date: 'Aug 05', completed: true },
      { id: 'm-2', title: 'Frontend UI Implementation', date: 'Aug 12', completed: true },
      { id: 'm-3', title: 'Security & Penetration Testing', date: 'Aug 18', completed: false },
      { id: 'm-4', title: 'Client Sign-off & Launch', date: 'Aug 28', completed: false },
    ],
    activities: [
      { id: 'a-1', user: 'Sarah Jenkins', action: 'Uploaded DB Schema specification', time: '2 hours ago' },
      { id: 'a-2', user: 'Alex Rivera', action: 'Completed glassmorphism dashboard layout', time: '5 hours ago' },
    ],
  },
  {
    id: 'proj-2',
    clientName: 'Acme Digital',
    title: 'Acme Brand Identity Refresh',
    status: 'AT RISK',
    statusType: 'warning',
    progress: 42,
    nextMilestone: 'Concept Presentation',
    dueDate: 'Aug 22, 2026',
    team: [
      { name: 'Elena Rostova', avatar: 'ER', role: 'Creative Director', color: 'var(--tertiary)' },
    ],
    budget: '$32,500',
    deliverables: [
      { id: 'd-5', title: 'Brand Guidelines & Typography System', status: 'COMPLETED', date: 'Aug 08, 2026' },
      { id: 'd-6', title: 'Concept Deck & Asset Package', status: 'IN_PROGRESS', date: 'Aug 22, 2026' },
    ],
    milestones: [
      { id: 'm-5', title: 'Brand Audit', date: 'Aug 08', completed: true },
      { id: 'm-6', title: 'Concept Presentation', date: 'Aug 22', completed: false },
    ],
    activities: [
      { id: 'a-3', user: 'Elena Rostova', action: 'Updated concept presentation slides', time: '1 day ago' },
    ],
  },
  {
    id: 'proj-3',
    clientName: 'Horizon Media Group',
    title: 'Horizon Media SEO Campaign',
    status: 'ON TRACK',
    statusType: 'success',
    progress: 85,
    nextMilestone: 'Final Report Delivery',
    dueDate: 'Aug 15, 2026',
    team: [
      { name: 'David Patel', avatar: 'DP', role: 'SEO Strategist', color: 'var(--primary)' },
      { name: 'Marcus Vance', avatar: 'MV', role: 'Content Lead', color: 'var(--secondary)' },
    ],
    budget: '$18,000',
    deliverables: [
      { id: 'd-7', title: 'Technical SEO Audit & Keyword Matrix', status: 'COMPLETED', date: 'Aug 01, 2026' },
      { id: 'd-8', title: 'Backlink Campaign Execution', status: 'COMPLETED', date: 'Aug 10, 2026' },
      { id: 'd-9', title: 'Monthly Analytics Report', status: 'IN_PROGRESS', date: 'Aug 15, 2026' },
    ],
    milestones: [
      { id: 'm-7', title: 'Site Audit', date: 'Aug 01', completed: true },
      { id: 'm-8', title: 'Content Optimization', date: 'Aug 10', completed: true },
      { id: 'm-9', title: 'Final Report', date: 'Aug 15', completed: false },
    ],
    activities: [
      { id: 'a-4', user: 'David Patel', action: 'Generated organic ranking report', time: '3 hours ago' },
    ],
  },
  {
    id: 'proj-4',
    clientName: 'Nexus Cloud Infrastructure',
    title: 'Nexus Cloud Infrastructure Agency Project',
    status: 'ON TRACK',
    statusType: 'success',
    progress: 15,
    nextMilestone: 'Infrastructure Setup',
    dueDate: 'Sep 05, 2026',
    team: [
      { name: 'Sarah Jenkins', avatar: 'SJ', role: 'DevOps Lead', color: 'var(--primary)' },
    ],
    budget: '$65,000',
    deliverables: [
      { id: 'd-10', title: 'Cloud Terraform Scripts', status: 'IN_PROGRESS', date: 'Sep 05, 2026' },
    ],
    milestones: [
      { id: 'm-10', title: 'Architecture Review', date: 'Aug 15', completed: true },
      { id: 'm-11', title: 'Terraform Infrastructure Setup', date: 'Sep 05', completed: false },
    ],
    activities: [
      { id: 'a-5', user: 'Sarah Jenkins', action: 'Configured AWS IAM roles and VPN', time: 'Yesterday' },
    ],
  },
];

export async function GET() {
  try {
    const deals = await prisma.deal.findMany({
      include: {
        company: { select: { name: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (deals.length > 0) {
      const mappedProjects = deals.map((d, idx) => {
        const fallback = defaultProjects[idx % defaultProjects.length];
        return {
          id: d.id,
          clientName: d.company?.name || fallback.clientName,
          title: d.title || fallback.title,
          status: d.stage === 'CLOSED_WON' || d.stage === 'NEGOTIATION' ? 'ON TRACK' : 'AT RISK',
          statusType: d.stage === 'CLOSED_WON' ? 'success' : 'warning',
          progress: d.stage === 'CLOSED_WON' ? 85 : d.stage === 'PROPOSAL' ? 45 : 68,
          nextMilestone: fallback.nextMilestone,
          dueDate: fallback.dueDate,
          team: fallback.team,
          budget: `$${d.value.toLocaleString()}`,
          deliverables: fallback.deliverables,
          milestones: fallback.milestones,
          activities: fallback.activities,
        };
      });

      return NextResponse.json({ success: true, data: mappedProjects });
    }

    return NextResponse.json({ success: true, data: defaultProjects });
  } catch (error) {
    return NextResponse.json({ success: true, data: defaultProjects });
  }
}
