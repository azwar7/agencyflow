import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface SessionData {
  sessionId?: string;
  userId: string;
  workspaceId: string;
  email: string;
  fullName: string;
  role: string;
  agencyName: string;
}

export const SESSION_COOKIE_NAME = 'agencyflow_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

/**
 * Computes a SHA-256 hash of the raw session token for secure database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a cryptographically random 256-bit session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Creates a new database session record associated with the user and returns the raw token.
 */
export async function createSession(userId: string): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

/**
 * Resolves the authenticated user & workspace from the database-backed session token.
 * Strictly derives the workspace from session -> user -> workspace (zero client trust).
 */
export async function getAuthSession(request?: Request): Promise<SessionData> {
  let sessionToken: string | null = null;

  // 1. Check incoming request cookie header
  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      sessionToken = decodeURIComponent(match[1].trim().replace(/^"|"$/g, ''));
    }
  }

  // 2. Next.js server cookie store fallback
  if (!sessionToken) {
    try {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
    } catch {
      // Ignore if called outside Server Component / Action / Route Handler context
    }
  }

  if (!sessionToken) {
    throw new Error('Unauthorized: No active session. Please log in.');
  }

  const tokenHash = hashToken(sessionToken);

  // Look up session in database with User and Workspace
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error('Unauthorized: Invalid session. Please log in.');
  }

  // Verify expiration
  if (session.expiresAt < new Date()) {
    // Asynchronously delete expired session
    prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    throw new Error('Unauthorized: Session expired. Please log in again.');
  }

  const user = session.user;
  if (!user || !user.workspace) {
    throw new Error('Unauthorized: User or associated workspace not found.');
  }

  return {
    sessionId: session.id,
    userId: user.id,
    workspaceId: user.workspace.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    agencyName: user.workspace.name,
  };
}

/**
 * Invalidates and deletes the server-side session from the database.
 */
export async function deleteSession(request?: Request): Promise<void> {
  let sessionToken: string | null = null;

  if (request) {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`));
    if (match) {
      sessionToken = decodeURIComponent(match[1].trim().replace(/^"|"$/g, ''));
    }
  }

  if (!sessionToken) {
    try {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
    } catch {}
  }

  if (sessionToken) {
    const tokenHash = hashToken(sessionToken);
    try {
      await prisma.session.deleteMany({
        where: { tokenHash },
      });
    } catch (err) {
      console.warn('[auth-session] Failed to delete session from DB:', err);
    }
  }
}

/**
 * Attaches the httpOnly session cookie to an outgoing HTTP response.
 */
export function setSessionCookie(response: NextResponse, rawToken: string): void {
  response.cookies.set(SESSION_COOKIE_NAME, rawToken, SESSION_COOKIE_OPTIONS);
}

/**
 * Clears the session cookie from the client browser.
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });
  // Clear legacy auth cookie if present
  response.cookies.set('agencyflow_auth', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}
