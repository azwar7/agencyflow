import { Redis } from '@upstash/redis';

export type LeadFinderJobStatus = 'STARTING' | 'RUNNING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface LeadFinderJob {
  id: string;
  workspaceId: string;
  query: string;
  location: string;
  status: LeadFinderJobStatus;
  leadsFound: number;
  leadIds: string[];
  error?: string;
  startedAt: string;
  updatedAt: string;
  lastLeadAt?: string;
  requestedBy?: string;
}

// In-Memory Storage for zero-latency, local dev and fallback
const inMemoryJobs = new Map<string, LeadFinderJob>();

// Initialize Redis if credentials exist
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
let redisClient: Redis | null = null;
if (redisUrl && redisToken) {
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
  } catch {
    redisClient = null;
  }
}

const REDIS_KEY_PREFIX = 'agencyflow:leadfinder:job:';
const JOB_EXPIRY_SECONDS = 60 * 60; // 1 hour

async function saveJob(job: LeadFinderJob): Promise<void> {
  inMemoryJobs.set(job.workspaceId, job);

  if (redisClient) {
    try {
      await redisClient.set(
        `${REDIS_KEY_PREFIX}${job.workspaceId}`,
        JSON.stringify(job),
        { ex: JOB_EXPIRY_SECONDS }
      );
    } catch (err) {
      console.warn('[LeadFinder Tracker] Redis save error (using in-memory fallback):', err);
    }
  }
}

async function loadJob(workspaceId: string): Promise<LeadFinderJob | null> {
  // Check in-memory first
  let job = inMemoryJobs.get(workspaceId) || null;

  if (!job && redisClient) {
    try {
      const data = await redisClient.get<string | LeadFinderJob>(`${REDIS_KEY_PREFIX}${workspaceId}`);
      if (data) {
        job = typeof data === 'string' ? JSON.parse(data) : data;
        if (job) {
          inMemoryJobs.set(workspaceId, job);
        }
      }
    } catch (err) {
      console.warn('[LeadFinder Tracker] Redis load error:', err);
    }
  }

  if (!job) return null;

  // Run watchdog rules:
  // 1. Debounce Completion: If we received leads and no new lead has arrived for 8 seconds, mark as COMPLETED
  const now = Date.now();
  const lastUpdate = new Date(job.updatedAt).getTime();
  const started = new Date(job.startedAt).getTime();

  if (job.status === 'PROCESSING' && job.leadsFound > 0 && job.lastLeadAt) {
    const lastLeadTime = new Date(job.lastLeadAt).getTime();
    if (now - lastLeadTime >= 8000) {
      job.status = 'COMPLETED';
      job.updatedAt = new Date().toISOString();
      await saveJob(job);
      return job;
    }
  }

  // 2. Timeout Watchdog: If job has been running for >= 75 seconds without completing
  if (['STARTING', 'RUNNING', 'PROCESSING'].includes(job.status)) {
    if (now - started >= 75000) {
      if (job.leadsFound > 0) {
        job.status = 'COMPLETED';
      } else {
        job.status = 'FAILED';
        job.error = 'Lead search timed out. n8n workflow took too long or returned no leads.';
      }
      job.updatedAt = new Date().toISOString();
      await saveJob(job);
      return job;
    }
  }

  return job;
}

/**
 * Starts a new background lead finder job for a workspace.
 * Rejects if a job is already in an active running state.
 */
export async function startLeadFinderJob(params: {
  workspaceId: string;
  query: string;
  location: string;
  requestedBy?: string;
}): Promise<{ job: LeadFinderJob; error?: string }> {
  const existingJob = await loadJob(params.workspaceId);

  // If a job is actively running (< 75 seconds old and not completed/failed)
  if (existingJob && ['STARTING', 'RUNNING', 'PROCESSING'].includes(existingJob.status)) {
    const elapsed = Date.now() - new Date(existingJob.startedAt).getTime();
    if (elapsed < 75000) {
      return {
        job: existingJob,
        error: `A lead search for "${existingJob.query}" in "${existingJob.location}" is already running in your workspace.`,
      };
    }
  }

  const now = new Date().toISOString();
  const newJob: LeadFinderJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    workspaceId: params.workspaceId,
    query: params.query,
    location: params.location,
    status: 'STARTING',
    leadsFound: 0,
    leadIds: [],
    startedAt: now,
    updatedAt: now,
    requestedBy: params.requestedBy,
  };

  await saveJob(newJob);
  return { job: newJob };
}

/**
 * Updates an active job to RUNNING state after the webhook trigger succeeds.
 */
export async function setJobRunning(workspaceId: string, jobId: string): Promise<void> {
  const job = await loadJob(workspaceId);
  if (job && job.id === jobId && job.status === 'STARTING') {
    job.status = 'RUNNING';
    job.updatedAt = new Date().toISOString();
    await saveJob(job);
  }
}

/**
 * Records a lead ingested into the CRM, incrementing the lead counter
 * and transitioning the job into 'PROCESSING'.
 */
export async function recordLeadIngested(workspaceId: string, leadId: string): Promise<void> {
  const job = await loadJob(workspaceId);
  if (!job) return;

  // Only update if job is active or was recently completed
  const now = new Date().toISOString();
  if (!job.leadIds.includes(leadId)) {
    job.leadIds.push(leadId);
    job.leadsFound = job.leadIds.length;
    job.status = 'PROCESSING';
    job.lastLeadAt = now;
    job.updatedAt = now;
    await saveJob(job);
  }
}

/**
 * Explicitly marks a job as COMPLETED.
 */
export async function completeLeadFinderJob(workspaceId: string, totalFound?: number): Promise<void> {
  const job = await loadJob(workspaceId);
  if (!job) return;

  job.status = 'COMPLETED';
  if (typeof totalFound === 'number') {
    job.leadsFound = totalFound;
  }
  job.updatedAt = new Date().toISOString();
  await saveJob(job);
}

/**
 * Explicitly marks a job as FAILED with an error reason.
 */
export async function failLeadFinderJob(workspaceId: string, errorMessage: string): Promise<void> {
  const job = await loadJob(workspaceId);
  if (!job) return;

  job.status = 'FAILED';
  job.error = errorMessage;
  job.updatedAt = new Date().toISOString();
  await saveJob(job);
}

/**
 * Gets the active or most recent job for a workspace.
 */
export async function getActiveLeadFinderJob(workspaceId: string): Promise<LeadFinderJob | null> {
  return await loadJob(workspaceId);
}

/**
 * Clears/Dismisses the job for a workspace.
 */
export async function dismissLeadFinderJob(workspaceId: string): Promise<void> {
  inMemoryJobs.delete(workspaceId);
  if (redisClient) {
    try {
      await redisClient.del(`${REDIS_KEY_PREFIX}${workspaceId}`);
    } catch {
      // ignore
    }
  }
}
