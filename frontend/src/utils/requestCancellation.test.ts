import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRequestSignature,
  cancelPendingRequest,
  registerRequest,
  removePendingRequest,
  isRequestCanceled,
  createAbortController,
  clearAllPendingRequests,
} from './requestCancellation';
import type { InternalAxiosRequestConfig } from 'axios';

describe('requestCancellation utility', () => {
  beforeEach(() => {
    clearAllPendingRequests();
  });

  it('generates consistent request signature', () => {
    const config = {
      method: 'get',
      url: '/crm/conversations',
      params: { page: 1, search: 'test' },
    } as unknown as InternalAxiosRequestConfig;

    const signature = getRequestSignature(config);
    expect(signature).toBe('GET:/crm/conversations:{"page":1,"search":"test"}');
  });

  it('auto-registers and cancels superseded search queries', () => {
    const config1 = {
      method: 'get',
      url: '/crm/conversations',
      params: { search: 'al' },
    } as unknown as InternalAxiosRequestConfig;

    registerRequest(config1);
    expect(config1.signal).toBeDefined();
    expect(config1.signal?.aborted).toBe(false);

    const config2 = {
      method: 'get',
      url: '/crm/conversations',
      params: { search: 'al' },
    } as unknown as InternalAxiosRequestConfig;

    registerRequest(config2);
    expect(config1.signal?.aborted).toBe(true);
    expect(config2.signal?.aborted).toBe(false);
  });

  it('removes pending request on completion', () => {
    const config = {
      method: 'get',
      url: '/crm/conversations',
      params: { search: 'test' },
    } as unknown as InternalAxiosRequestConfig;

    registerRequest(config);
    removePendingRequest(config);

    const signature = getRequestSignature(config);
    expect(() => cancelPendingRequest(signature)).not.toThrow();
  });

  it('correctly identifies canceled errors', () => {
    const canceledErr = { name: 'CanceledError' };
    const abortErr = { name: 'AbortError' };
    const codeErr = { code: 'ERR_CANCELED' };
    const regularErr = new Error('Regular error');

    expect(isRequestCanceled(canceledErr)).toBe(true);
    expect(isRequestCanceled(abortErr)).toBe(true);
    expect(isRequestCanceled(codeErr)).toBe(true);
    expect(isRequestCanceled(regularErr)).toBe(false);
  });

  it('creates standalone abort controller', () => {
    const { signal, abort } = createAbortController();
    expect(signal.aborted).toBe(false);
    abort('manual stop');
    expect(signal.aborted).toBe(true);
  });
});
