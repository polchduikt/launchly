import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from './axios';
import { useAuthStore } from '../store/useAuthStore';
import { IDEMPOTENCY_HEADER_NAME } from '../utils/idempotency';

describe('apiClient request interceptor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ accessToken: null, refreshToken: null, user: null });
  });

  it('should automatically attach Idempotency-Key on POST requests', async () => {
    let capturedConfig: any = null;

    vi.spyOn(apiClient, 'request').mockImplementation(async (config: any) => {
      capturedConfig = config;
      return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
    });

    await apiClient.post('/test-endpoint', { name: 'Launchly' });

    expect(capturedConfig).not.toBeNull();
    const headers = capturedConfig.headers;
    const idempotencyKey = typeof headers.get === 'function'
      ? headers.get(IDEMPOTENCY_HEADER_NAME)
      : headers[IDEMPOTENCY_HEADER_NAME];

    expect(idempotencyKey).toBeDefined();
    expect(typeof idempotencyKey).toBe('string');
    expect(idempotencyKey.length).toBeGreaterThan(10);
  });

  it('should automatically attach Idempotency-Key on DELETE requests', async () => {
    let capturedConfig: any = null;

    vi.spyOn(apiClient, 'request').mockImplementation(async (config: any) => {
      capturedConfig = config;
      return { data: {}, status: 204, statusText: 'No Content', headers: {}, config };
    });

    await apiClient.delete('/test-endpoint/123');

    expect(capturedConfig).not.toBeNull();
    const headers = capturedConfig.headers;
    const idempotencyKey = typeof headers.get === 'function'
      ? headers.get(IDEMPOTENCY_HEADER_NAME)
      : headers[IDEMPOTENCY_HEADER_NAME];

    expect(idempotencyKey).toBeDefined();
    expect(typeof idempotencyKey).toBe('string');
  });

  it('should automatically attach Idempotency-Key on PATCH requests', async () => {
    let capturedConfig: any = null;

    vi.spyOn(apiClient, 'request').mockImplementation(async (config: any) => {
      capturedConfig = config;
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    });

    await apiClient.patch('/test-endpoint/123', { active: true });

    expect(capturedConfig).not.toBeNull();
    const headers = capturedConfig.headers;
    const idempotencyKey = typeof headers.get === 'function'
      ? headers.get(IDEMPOTENCY_HEADER_NAME)
      : headers[IDEMPOTENCY_HEADER_NAME];

    expect(idempotencyKey).toBeDefined();
  });

  it('should NOT attach Idempotency-Key on GET requests', async () => {
    let capturedConfig: any = null;

    vi.spyOn(apiClient, 'request').mockImplementation(async (config: any) => {
      capturedConfig = config;
      return { data: [], status: 200, statusText: 'OK', headers: {}, config };
    });

    await apiClient.get('/test-endpoint');

    expect(capturedConfig).not.toBeNull();
    const headers = capturedConfig.headers;
    const idempotencyKey = typeof headers.get === 'function'
      ? headers.get(IDEMPOTENCY_HEADER_NAME)
      : headers[IDEMPOTENCY_HEADER_NAME];

    expect(idempotencyKey).toBeUndefined();
  });

  it('should preserve manual Idempotency-Key if already provided', async () => {
    let capturedConfig: any = null;
    const customKey = 'custom-user-provided-key-999';

    vi.spyOn(apiClient, 'request').mockImplementation(async (config: any) => {
      capturedConfig = config;
      return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
    });

    await apiClient.post('/test-endpoint', {}, {
      headers: { [IDEMPOTENCY_HEADER_NAME]: customKey },
    });

    expect(capturedConfig).not.toBeNull();
    const headers = capturedConfig.headers;
    const idempotencyKey = typeof headers.get === 'function'
      ? headers.get(IDEMPOTENCY_HEADER_NAME)
      : headers[IDEMPOTENCY_HEADER_NAME];

    expect(idempotencyKey).toBe(customKey);
  });

  it('should attach Bearer token when accessToken is present in auth store', async () => {
    useAuthStore.setState({ accessToken: 'sample-jwt-token', refreshToken: null, user: null });
    let capturedConfig: any = null;

    vi.spyOn(apiClient, 'request').mockImplementation(async (config: any) => {
      capturedConfig = config;
      return { data: [], status: 200, statusText: 'OK', headers: {}, config };
    });

    await apiClient.get('/secure-data');

    expect(capturedConfig).not.toBeNull();
    const headers = capturedConfig.headers;
    const authHeader = typeof headers.get === 'function'
      ? headers.get('Authorization')
      : headers['Authorization'];

    expect(authHeader).toBe('Bearer sample-jwt-token');
  });
});
