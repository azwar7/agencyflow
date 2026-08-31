import { prisma } from '@/lib/prisma';
import { N8nLeadPayload } from './schema';

export interface N8nAuthContext {
  workspaceId: string;
  workspaceName: string;
  defaultUserId: string;
}

export class N8nAuthenticationError extends Error {
  public readonly status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = 'N8nAuthenticationError';
    this.status = status;
  }
}

/**
 * Extracts and verifies the n8n integration secret from incoming request headers.
 * Resolves the target workspace securely while maintaining multi-tenant boundaries.
 */
export async function authenticateN8nRequest(
  request: Request,
  payload?: Partial<N8nLeadPayload>
): Promise<N8nAuthContext> {
  const configuredSecret =
    process.env.N8N_INTEGRATION_SECRET || process.env['Agencyflow-Auth'];
  if (!configuredSecret || configuredSecret.trim().length === 0) {
    throw new N8nAuthenticationError(
      'N8N_INTEGRATION_SECRET is not configured on the server.',
      500
    );
  }

  // 1. Extract Bearer token from Authorization, x-n8n-secret, or Agencyflow-Auth header
  const authHeader = request.headers.get('authorization') || '';
  const xSecretHeader = request.headers.get('x-n8n-secret') || '';
  const agencyflowAuthHeader = request.headers.get('agencyflow-auth') || '';

  let receivedSecret = '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    receivedSecret = authHeader.slice(7).trim();
  } else if (xSecretHeader) {
    receivedSecret = xSecretHeader.trim();
  } else if (agencyflowAuthHeader) {
    receivedSecret = agencyflowAuthHeader.trim();
  }

  if (!receivedSecret || receivedSecret !== configuredSecret.trim()) {
    throw new N8nAuthenticationError(
      'Unauthorized: Invalid or missing integration secret.',
      401
    );
  }

  // 2. Resolve target workspace (Header overrides -> Payload overrides -> Env default -> Primary workspace)
  const headerWorkspaceId = request.headers.get('x-workspace-id')?.trim();
  const headerWorkspaceSlug = request.headers.get('x-workspace-slug')?.trim();
  const targetWorkspaceId = headerWorkspaceId || payload?.workspaceId;
  const targetWorkspaceSlug = headerWorkspaceSlug || payload?.workspaceSlug;
  const defaultEnvWorkspaceId = process.env.N8N_DEFAULT_WORKSPACE_ID?.trim();

  let workspace = null;

  if (targetWorkspaceId) {
    workspace = await prisma.workspace.findUnique({
      where: { id: targetWorkspaceId },
      select: { id: true, name: true },
    });
    if (!workspace) {
      throw new N8nAuthenticationError(
        `Target workspace with ID "${targetWorkspaceId}" not found.`,
        404
      );
    }
  } else if (targetWorkspaceSlug) {
    workspace = await prisma.workspace.findUnique({
      where: { slug: targetWorkspaceSlug },
      select: { id: true, name: true },
    });
    if (!workspace) {
      throw new N8nAuthenticationError(
        `Target workspace with slug "${targetWorkspaceSlug}" not found.`,
        404
      );
    }
  } else if (defaultEnvWorkspaceId) {
    workspace = await prisma.workspace.findUnique({
      where: { id: defaultEnvWorkspaceId },
      select: { id: true, name: true },
    });
  }

  // If still not resolved, fallback to the primary (first created) workspace
  if (!workspace) {
    workspace = await prisma.workspace.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });
  }

  if (!workspace) {
    throw new N8nAuthenticationError(
      'No active workspace found in database to assign incoming n8n lead.',
      404
    );
  }

  // 3. Find an active user in the workspace to assign ownership & activity logs
  let user = await prisma.user.findFirst({
    where: {
      workspaceId: workspace.id,
      role: 'OWNER',
    },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.findFirst({
      where: { workspaceId: workspace.id },
      select: { id: true },
    });
  }

  if (!user) {
    throw new N8nAuthenticationError(
      `Workspace "${workspace.name}" has no registered users to assign leads.`,
      400
    );
  }

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    defaultUserId: user.id,
  };
}
