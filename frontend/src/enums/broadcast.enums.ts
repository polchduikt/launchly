export const CampaignStatus = {
  Draft: 'DRAFT',
  Scheduled: 'SCHEDULED',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Failed: 'FAILED',
  Blocked: 'BLOCKED',
} as const;

export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const FilterType = {
  All: 'ALL',
  ByTag: 'BY_TAG',
  HasOrders: 'HAS_ORDERS',
  HasLeads: 'HAS_LEADS',
} as const;

export type FilterType = (typeof FilterType)[keyof typeof FilterType];
