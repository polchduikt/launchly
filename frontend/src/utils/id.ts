export const generateId = (prefix?: string): string => {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  return prefix ? `${prefix}_${uuid}` : uuid;
};
