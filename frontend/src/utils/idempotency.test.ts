import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  IDEMPOTENCY_HEADER_NAME,
  IDEMPOTENT_MUTATION_METHODS,
  generateIdempotencyKey,
  shouldAttachIdempotencyKey,
} from './idempotency';

describe('idempotency utility', () => {
  const originalCrypto = globalThis.crypto;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'crypto', {
      value: originalCrypto,
      writable: true,
      configurable: true,
    });
  });

  it('should define the standard header name and mutation methods', () => {
    expect(IDEMPOTENCY_HEADER_NAME).toBe('Idempotency-Key');
    expect(IDEMPOTENT_MUTATION_METHODS).toEqual(['POST', 'DELETE', 'PATCH']);
  });

  it('should generate valid UUID v4 string using crypto.randomUUID when available', () => {
    const mockUuid = '123e4567-e89b-42d3-a456-426614174000';
    Object.defineProperty(globalThis, 'crypto', {
      value: { randomUUID: vi.fn(() => mockUuid) },
      writable: true,
      configurable: true,
    });

    const key = generateIdempotencyKey();
    expect(key).toBe(mockUuid);
  });

  it('should generate valid UUID v4 string format when crypto is undefined', () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const key = generateIdempotencyKey();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(uuidV4Regex.test(key)).toBe(true);
  });

  it('should correctly identify when idempotency key should be attached', () => {
    expect(shouldAttachIdempotencyKey('post')).toBe(true);
    expect(shouldAttachIdempotencyKey('POST')).toBe(true);
    expect(shouldAttachIdempotencyKey('delete')).toBe(true);
    expect(shouldAttachIdempotencyKey('DELETE')).toBe(true);
    expect(shouldAttachIdempotencyKey('patch')).toBe(true);
    expect(shouldAttachIdempotencyKey('PATCH')).toBe(true);
    expect(shouldAttachIdempotencyKey('get')).toBe(false);
    expect(shouldAttachIdempotencyKey('GET')).toBe(false);
    expect(shouldAttachIdempotencyKey('put')).toBe(false);
    expect(shouldAttachIdempotencyKey('PUT')).toBe(false);
    expect(shouldAttachIdempotencyKey(undefined)).toBe(false);
  });
});
