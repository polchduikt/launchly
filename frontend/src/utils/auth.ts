export const isAdminOrManager = (role?: string | null): boolean =>
  role === 'ROLE_ADMIN' || role === 'ROLE_MANAGER';

export const getSafeRedirectUrl = (url: string | null | undefined): string | null => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.includes('\\') &&
    !trimmed.includes(':')
  ) {
    return trimmed;
  }
  return null;
};

