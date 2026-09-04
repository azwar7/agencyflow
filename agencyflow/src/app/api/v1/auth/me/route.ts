import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth-session';

interface CachedWorkspaceMeta {
  slug: string;
  counts: Record<string, number>;
  hasAnyData: boolean;
  isSampleData: boolean;
  checklist: {
    hasClient: boolean;
    hasDealOrLead: boolean;
    hasDeliverableOrProject: boolean;
    hasTask: boolean;
  };
  expiresAt: number;
}

const globalWsMetaCache = global as unknown as {
  _agencyflow_ws_meta_cache?: Map<string, CachedWorkspaceMeta>;
};
if (!globalWsMetaCache._agencyflow_ws_meta_cache) {
  globalWsMetaCache._agencyflow_ws_meta_cache = new Map<string, CachedWorkspaceMeta>();
}
const wsMetaCache = globalWsMetaCache._agencyflow_ws_meta_cache;

function invalidateWorkspaceMetaCache(workspaceId?: string) {
  if (workspaceId) {
    wsMetaCache.delete(workspaceId);
  } else {
    wsMetaCache.clear();
  }
}

export async function GET(request: Request) {
  try {
    const session = await getAuthSession(request);
    const workspaceId = session.workspaceId;

    // Check fast in-memory cache for workspace checklist & counts
    let meta = wsMetaCache.get(workspaceId);
    if (!meta || meta.expiresAt <= Date.now()) {
      // Get workspace with counts strictly scoped to the session's workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          slug: true,
          _count: {
            select: {
              leads: true,
              deals: true,
              companies: true,
              projects: true,
              deliverables: true,
              invoices: true,
              tasks: true,
            },
          },
        },
      });

      if (!workspace) {
        return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
      }

      const sampleLead = await prisma.lead.findFirst({
        where: { workspaceId, isSample: true },
        select: { id: true },
      });

      const hasAnyData =
        workspace._count.leads > 0 ||
        workspace._count.deals > 0 ||
        workspace._count.companies > 0 ||
        workspace._count.projects > 0 ||
        workspace._count.deliverables > 0 ||
        workspace._count.invoices > 0;

      const checklist = {
        hasClient: workspace._count.companies > 0,
        hasDealOrLead: workspace._count.deals > 0 || workspace._count.leads > 0,
        hasDeliverableOrProject: workspace._count.deliverables > 0 || workspace._count.projects > 0,
        hasTask: workspace._count.tasks > 0,
      };

      meta = {
        slug: workspace.slug,
        counts: workspace._count,
        hasAnyData,
        isSampleData: Boolean(sampleLead),
        checklist,
        expiresAt: Date.now() + 60_000, // 60s TTL
      };

      wsMetaCache.set(workspaceId, meta);
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: session.userId,
          email: session.email,
          name: session.fullName,
          role: session.role,
          agency: session.agencyName,
          workspaceId: session.workspaceId,
          persona: session.persona || 'AGENCY',
          isFirstLogin: false,
        },
        workspace: {
          id: session.workspaceId,
          name: session.agencyName,
          slug: meta.slug,
          persona: session.persona || 'AGENCY',
          counts: meta.counts,
          hasAnyData: meta.hasAnyData,
          isSampleData: meta.isSampleData,
          checklist: meta.checklist,
        },
      },
    });
  } catch (error: any) {
    const response = NextResponse.json(
      { success: false, error: { message: error.message || 'Unauthorized' } },
      { status: 401 }
    );
    response.cookies.set('agencyflow_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }
}
