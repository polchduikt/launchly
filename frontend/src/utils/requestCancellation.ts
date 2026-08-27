import axios, { type InternalAxiosRequestConfig } from 'axios';

const pendingRequests = new Map<string, AbortController>();

export const getRequestSignature = (config: InternalAxiosRequestConfig): string => {
  const method = (config.method || 'get').toUpperCase();
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${method}:${url}:${params}`;
};

export const cancelPendingRequest = (signature: string): void => {
  const existingController = pendingRequests.get(signature);
  if (existingController) {
    existingController.abort('Request superseded by newer request');
    pendingRequests.delete(signature);
  }
};

export const registerRequest = (
  config: InternalAxiosRequestConfig,
  autoCancelDuplicate: boolean = false
): InternalAxiosRequestConfig => {
  if (config.signal) {
    return config;
  }

  const isGet = (config.method || 'get').toUpperCase() === 'GET';
  const isSearchQuery =
    config.params && ('query' in config.params || 'search' in config.params || 'q' in config.params);

  if (autoCancelDuplicate || (isGet && isSearchQuery)) {
    const signature = getRequestSignature(config);
    cancelPendingRequest(signature);

    const controller = new AbortController();
    config.signal = controller.signal;
    pendingRequests.set(signature, controller);
  }

  return config;
};

export const removePendingRequest = (config: InternalAxiosRequestConfig): void => {
  const signature = getRequestSignature(config);
  pendingRequests.delete(signature);
};

export const isRequestCanceled = (error: unknown): boolean => {
  if (axios.isCancel(error)) {
    return true;
  }
  if (error && typeof error === 'object') {
    const err = error as { name?: string; code?: string };
    return err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED';
  }
  return false;
};

export const createAbortController = (): {
  signal: AbortSignal;
  abort: (reason?: string) => void;
} => {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    abort: (reason) => controller.abort(reason),
  };
};

export const clearAllPendingRequests = (): void => {
  pendingRequests.forEach((controller) => {
    controller.abort('All requests aborted');
  });
  pendingRequests.clear();
};
