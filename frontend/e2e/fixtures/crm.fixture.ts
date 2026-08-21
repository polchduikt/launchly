export const MOCK_CONVERSATIONS = [
  {
    id: 101,
    botId: 1,
    botUserId: 201,
    status: 'OPEN',
    unread: true,
    lastMessageAt: '2025-03-01T12:00:00Z',
    botUserName: 'Alex Client',
    botUserUsername: 'alexclient',
    lastMessageSnippet: 'Can you help me with an order?',
  },
  {
    id: 102,
    botId: 1,
    botUserId: 202,
    status: 'CLOSED',
    unread: false,
    lastMessageAt: '2025-03-01T10:00:00Z',
    botUserName: 'Maria Doe',
    botUserUsername: 'mariadoe',
    lastMessageSnippet: 'Thanks, all good!',
  },
];

export const MOCK_MESSAGES = [
  {
    id: 1001,
    conversationId: 101,
    content: 'Hello, I want to track my parcel.',
    senderType: 'USER',
    createdAt: '2025-03-01T11:58:00Z',
  },
  {
    id: 1002,
    conversationId: 101,
    content: 'Sure! Please provide your order number.',
    senderType: 'BOT',
    createdAt: '2025-03-01T11:59:00Z',
  },
];
