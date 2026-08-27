export const IDEMPOTENCY_HEADER_NAME = 'Idempotency-Key';

export const IDEMPOTENT_MUTATION_METHODS = ['POST', 'DELETE', 'PATCH'] as const;

export const generateIdempotencyKey = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomNibble = (Math.random() * 16) | 0;
    const value = character === 'x' ? randomNibble : (randomNibble & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const shouldAttachIdempotencyKey = (method?: string): boolean => {
  if (!method) {
    return false;
  }
  const upperMethod = method.toUpperCase();
  return upperMethod === 'POST' || upperMethod === 'DELETE' || upperMethod === 'PATCH';
};
