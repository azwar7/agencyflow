import crypto from 'crypto';
import { prisma } from './prisma';

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}

export function generateHmacSignature(secret: string, payloadString: string): string {
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

export async function dispatchWebhookEvent(
  workspaceId: string,
  event: string,
  payload: any
): Promise<void> {
  try {
    const subscriptions = await prisma.webhookSubscription.findMany({
      where: {
        workspaceId,
        isActive: true,
      },
    });

    const relevantSubscriptions = subscriptions.filter((sub) => {
      const events = Array.isArray(sub.events) ? (sub.events as string[]) : [];
      return events.includes(event) || events.includes('*');
    });

    if (relevantSubscriptions.length === 0) return;

    const payloadString = JSON.stringify({
      id: crypto.randomUUID(),
      event,
      createdAt: new Date().toISOString(),
      workspaceId,
      data: payload,
    });

    await Promise.all(
      relevantSubscriptions.map(async (sub) => {
        const signature = generateHmacSignature(sub.secret, payloadString);
        const startTime = Date.now();
        let status = 'FAILED';
        let statusCode: number | null = null;
        let responseBody: string | null = null;
        let errorMsg: string | null = null;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const res = await fetch(sub.targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'AgencyFlow-Webhook/1.0',
              'x-agencyflow-event': event,
              'x-agencyflow-signature': signature,
            },
            body: payloadString,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          statusCode = res.status;
          responseBody = await res.text().catch(() => null);
          if (res.ok) {
            status = 'SUCCESS';
          } else {
            errorMsg = `HTTP error ${res.status}`;
          }
        } catch (err: any) {
          errorMsg = err.name === 'AbortError' ? 'Delivery timed out after 8s' : err.message;
        }

        // Persist delivery record
        await prisma.webhookDelivery.create({
          data: {
            subscriptionId: sub.id,
            event,
            payload: JSON.parse(payloadString),
            status,
            statusCode,
            responseBody: responseBody ? responseBody.substring(0, 1000) : null,
            error: errorMsg,
          },
        });
      })
    );
  } catch (err: any) {
    console.error('[Webhooks Engine] Error dispatching event:', err);
  }
}

export async function testWebhookEndpoint(
  targetUrl: string,
  secret: string
): Promise<{ success: boolean; statusCode?: number; latencyMs: number; error?: string }> {
  const payloadString = JSON.stringify({
    id: crypto.randomUUID(),
    event: 'ping',
    createdAt: new Date().toISOString(),
    message: 'AgencyFlow Webhook Verification Ping',
  });

  const signature = generateHmacSignature(secret, payloadString);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AgencyFlow-Webhook-Tester/1.0',
        'x-agencyflow-event': 'ping',
        'x-agencyflow-signature': signature,
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    return {
      success: res.ok,
      statusCode: res.status,
      latencyMs,
      error: res.ok ? undefined : `Target returned HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      error: err.name === 'AbortError' ? 'Connection timed out' : err.message,
    };
  }
}
