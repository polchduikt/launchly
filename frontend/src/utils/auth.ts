export const isAdminOrManager = (role?: string | null): boolean =>
  role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';
