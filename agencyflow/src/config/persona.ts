export type WorkspacePersona = 'AGENCY' | 'FREELANCER';

export interface PersonaDictionary {
  personaLabel: string;
  roleOwnerLabel: string;
  clientsNavLabel: string;
  clientsHeaderTag: string;
  clientsPageTitle: string;
  contractsNoun: string;
  teamNavLabel: string;
  teamHeaderTag: string;
  teamPageTitle: string;
  teamInviteButton: string;
  teamMemberNoun: string;
  projectsNavLabel: string;
  projectsPageTitle: string;
}

export const PERSONA_CONFIG: Record<WorkspacePersona, PersonaDictionary> = {
  AGENCY: {
    personaLabel: 'Digital Agency',
    roleOwnerLabel: 'Agency Owner',
    clientsNavLabel: 'Clients',
    clientsHeaderTag: 'AGENCY DIRECTORY',
    clientsPageTitle: 'Clients & Retainers',
    contractsNoun: 'Contracted Retainers',
    teamNavLabel: 'Team',
    teamHeaderTag: 'AGENCY HEADCOUNT & ALLOCATION',
    teamPageTitle: 'Team & Workload Command Center',
    teamInviteButton: 'Invite Member',
    teamMemberNoun: 'Reps & Leads',
    projectsNavLabel: 'Projects',
    projectsPageTitle: 'Client Roadmaps & Milestones',
  },
  FREELANCER: {
    personaLabel: 'Solo Freelancer',
    roleOwnerLabel: 'Solo Freelancer',
    clientsNavLabel: 'Clients',
    clientsHeaderTag: 'CLIENT DIRECTORY',
    clientsPageTitle: 'Clients & Engagements',
    contractsNoun: 'Recurring Engagements',
    teamNavLabel: 'Collaborators',
    teamHeaderTag: 'COLLABORATOR & CONTRACTOR NETWORK',
    teamPageTitle: 'Collaborator & Contractor Network',
    teamInviteButton: 'Invite Collaborator',
    teamMemberNoun: 'Collaborators',
    projectsNavLabel: 'Engagements',
    projectsPageTitle: 'Deliverable Milestones & Gigs',
  },
};

export function getPersonaConfig(persona?: string | null): PersonaDictionary {
  if (persona === 'FREELANCER') return PERSONA_CONFIG.FREELANCER;
  return PERSONA_CONFIG.AGENCY;
}
