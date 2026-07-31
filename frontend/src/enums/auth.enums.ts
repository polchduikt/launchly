export const UserRole = {
  Admin: 'ROLE_ADMIN',
  User: 'ROLE_USER',
  Manager: 'ROLE_MANAGER',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
