export const queryKeys = {
  bots: {
    all: ['bots'] as const,
    detail: (botId: number) => ['bot', botId] as const,
    schema: (botId: number) => ['bot_schema', botId] as const,
    users: (botId: number) => ['botUsers', botId] as const,
    allUsers: ['allBotUsers'] as const,
  },
  crm: {
    all: ['crm'] as const,
    conversationsRoot: ['conversations'] as const,
    conversations: (botId?: number) => (botId ? (['conversations', botId] as const) : (['conversations'] as const)),
    allConversations: ['conversations', 'all'] as const,
    conversation: (conversationId: number) => ['conversation', conversationId] as const,
    messages: (conversationId: number) => ['messages', conversationId] as const,
    leadsRoot: ['leads'] as const,
    leads: (botId?: number) => (botId ? (['leads', botId] as const) : (['leads'] as const)),
    ordersRoot: ['orders'] as const,
    orders: (botId?: number) => (botId ? (['orders', botId] as const) : (['orders'] as const)),
  },
  broadcasts: {
    all: ['broadcasts'] as const,
    campaigns: (botId: number) => ['campaigns', botId] as const,
    tagsRoot: ['tags'] as const,
    tags: (botId?: number) => (botId ? (['tags', botId] as const) : (['tags'] as const)),
  },
  templates: {
    all: ['templates'] as const,
    installed: ['installed_templates'] as const,
    detail: (id: string | number) => ['template', id] as const,
  },
  integrations: {
    all: ['integrations'] as const,
  },
  support: {
    all: ['user-support-tickets'] as const,
    detail: (id: string | number) => ['user-support-ticket', id] as const,
  },
  stats: {
    dashboard: (botId: number, days?: number) => ['dashboard-stats', botId, days] as const,
  },
  admin: {
    users: ['adminUsers'] as const,
    userDetails: (userId?: number) => (userId ? (['adminUserDetails', userId] as const) : (['adminUserDetails'] as const)),
    automations: ['adminAutomations'] as const,
    automationDetails: (id?: number) => (id ? (['adminAutomationDetails', id] as const) : (['adminAutomationDetails'] as const)),
    broadcasts: ['adminBroadcasts'] as const,
    broadcastDetails: (id?: number) => (id ? (['adminBroadcastDetails', id] as const) : (['adminBroadcastDetails'] as const)),
    supportTickets: ['adminSupportTickets'] as const,
    supportTicketDetail: (id?: number | null) => (id ? (['adminSupportTicketDetail', id] as const) : (['adminSupportTicketDetail'] as const)),
    logs: ['adminLogs'] as const,
    stats: ['adminStats'] as const,
  },
} as const;
