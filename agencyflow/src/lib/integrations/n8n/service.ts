import { prisma } from '@/lib/prisma';
import { isEmailAvailable } from '@/lib/lead-utils';
import { N8nLeadPayload } from './schema';
import { N8nAuthContext } from './auth';

export interface ProcessN8nLeadResult {
  isDuplicate: boolean;
  leadId: string;
  duplicateReason?: string;
  data?: any;
}

/**
 * Normalizes a URL/website string to an extractable clean root domain.
 * e.g. "http://www.bodyfuel.pk/about" -> "bodyfuel.pk"
 */
export function normalizeDomain(urlStr: string | null | undefined): string | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  try {
    let clean = urlStr.trim().toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `http://${clean}`;
    }
    const parsed = new URL(clean);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim().toLowerCase() || null;
  }
}

/**
 * Normalizes phone numbers by removing spaces, dashes, dots, and parentheses.
 */
export function normalizePhone(phoneStr: string | null | undefined): string | null {
  if (!phoneStr || typeof phoneStr !== 'string') return null;
  const digitsAndPlus = phoneStr.replace(/[^\d+]/g, '');
  return digitsAndPlus.length > 0 ? digitsAndPlus : null;
}

/**
 * Processes an incoming n8n lead payload with ordered deduplication,
 * multi-tenant workspace isolation, company auto-linking, and timeline activity logging.
 */
export async function processN8nLead(
  payload: N8nLeadPayload,
  authContext: N8nAuthContext
): Promise<ProcessN8nLeadResult> {
  const { workspaceId, defaultUserId } = authContext;
  const rawPhone = payload.phone || (payload.number ? String(payload.number) : null);
  const cleanPhone = normalizePhone(rawPhone);
  const cleanDomain = normalizeDomain(payload.website);
  const companyName = payload.name.trim();

  // -------------------------------------------------------------
  // 1. ORDERED DUPLICATE DETECTION
  // -------------------------------------------------------------

  // Step A: Deduplication by normalized Website / Domain
  if (cleanDomain) {
    const existingCompany = await prisma.company.findFirst({
      where: {
        workspaceId,
        domain: {
          contains: cleanDomain,
          mode: 'insensitive',
        },
      },
    });

    if (existingCompany) {
      const associatedLead = await prisma.lead.findFirst({
        where: {
          workspaceId,
          companyName: existingCompany.name,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (associatedLead) {
        return {
          isDuplicate: true,
          leadId: associatedLead.id,
          duplicateReason: `Duplicate website domain (${cleanDomain}) matched existing company "${existingCompany.name}".`,
        };
      }
    }
  }

  // Step B: Deduplication by Phone Number
  if (cleanPhone) {
    const existingLeadsWithPhone = await prisma.lead.findMany({
      where: {
        workspaceId,
        phone: { not: null },
      },
      select: { id: true, phone: true, firstName: true, lastName: true },
      orderBy: { createdAt: 'desc' },
    });

    const matchingLeadByPhone = existingLeadsWithPhone.find(
      (l) => l.phone && normalizePhone(l.phone) === cleanPhone
    );

    if (matchingLeadByPhone) {
      return {
        isDuplicate: true,
        leadId: matchingLeadByPhone.id,
        duplicateReason: `Duplicate phone number (${cleanPhone}) matched existing lead "${matchingLeadByPhone.firstName} ${matchingLeadByPhone.lastName}".`,
      };
    }
  }

  // Step C: Deduplication by Verified Email (only if genuine email exists)
  const rawEmail = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const contactEmail = isEmailAvailable(rawEmail) ? rawEmail : '';

  if (contactEmail) {
    const existingLeadByEmail = await prisma.lead.findFirst({
      where: {
        workspaceId,
        email: {
          equals: contactEmail,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingLeadByEmail) {
      return {
        isDuplicate: true,
        leadId: existingLeadByEmail.id,
        duplicateReason: `Duplicate email address (${contactEmail}) matched existing lead "${existingLeadByEmail.firstName} ${existingLeadByEmail.lastName}".`,
      };
    }
  }

  // Step D: Deduplication by Company Name
  const existingLeadByName = await prisma.lead.findFirst({
    where: {
      workspaceId,
      companyName: {
        equals: companyName,
        mode: 'insensitive',
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingLeadByName) {
    return {
      isDuplicate: true,
      leadId: existingLeadByName.id,
      duplicateReason: `Duplicate company name ("${companyName}") matched existing lead.`,
    };
  }

  // -------------------------------------------------------------
  // 2. LEAD SCORING & SUMMARY NORMALIZATION
  // -------------------------------------------------------------
  let normalizedScore = 60;
  if (typeof payload.score === 'number') {
    // If score is on 1-10 scale, scale to 0-100
    normalizedScore = payload.score <= 10 ? Math.round(payload.score * 10) : Math.round(payload.score);
  }

  const initialStatus = normalizedScore >= 70 ? 'QUALIFIED' : 'NEW';

  const aiSummary = payload.reason
    ? `AI Prospect Qualification (${payload.score !== null ? `Score: ${payload.score}/10` : 'Evaluated'}): ${payload.reason}`
    : 'Inbound business prospect discovered and qualified via Autonomous AI Lead Engine.';

  // Construct contact name (no fake placeholder email generated)
  const nameParts = companyName.split(' ');
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : companyName;
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : 'Lead';

  // -------------------------------------------------------------
  // 3. PERSIST LEAD & COMPANY IN DATABASE
  // -------------------------------------------------------------
  const newLead = await prisma.lead.create({
    data: {
      workspaceId,
      assignedToId: defaultUserId,
      firstName,
      lastName,
      email: contactEmail,
      phone: rawPhone || null,
      companyName,
      status: initialStatus,
      leadScore: normalizedScore,
      aiSummary,
      source: payload.source || 'n8n',
      isSample: false,
    },
    include: {
      assignedTo: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Auto-create or link Company
  let company = await prisma.company.findFirst({
    where: {
      workspaceId,
      name: {
        equals: companyName,
        mode: 'insensitive',
      },
    },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        workspaceId,
        name: companyName,
        domain: cleanDomain || null,
        industry: payload.reason?.toLowerCase().includes('fitness') ? 'Fitness & Recreation' : 'Commercial Services',
        isSample: false,
      },
    });
  } else if (cleanDomain && !company.domain) {
    company = await prisma.company.update({
      where: { id: company.id },
      data: { domain: cleanDomain },
    });
  }

  // -------------------------------------------------------------
  // 4. LOG COMPREHENSIVE CRM ACTIVITY
  // -------------------------------------------------------------
  const activityNotes = [
    `📥 Lead ingested via n8n automation workflow`,
    payload.address ? `📍 Address: ${payload.address}` : null,
    payload.website ? `🌐 Website: ${payload.website}` : null,
    rawPhone ? `📞 Phone: ${rawPhone}` : null,
    payload.score !== null ? `⭐ n8n Qualification Score: ${payload.score}/10` : null,
    payload.reason ? `💡 Qualification Reason: ${payload.reason}` : null,
  ].filter(Boolean).join('\n');

  await prisma.activity.create({
    data: {
      workspaceId,
      userId: defaultUserId,
      leadId: newLead.id,
      type: 'NOTE',
      content: activityNotes,
      isSample: false,
    },
  });

  return {
    isDuplicate: false,
    leadId: newLead.id,
    data: {
      ...newLead,
      company: {
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
      },
    },
  };
}
