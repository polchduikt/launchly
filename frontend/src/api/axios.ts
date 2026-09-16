import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';
import {
  IDEMPOTENCY_HEADER_NAME,
  generateIdempotencyKey,
  shouldAttachIdempotencyKey,
} from '../utils/idempotency';

import {
  registerRequest,
  removePendingRequest,
  isRequestCanceled,
} from '../utils/requestCancellation';
import { STORAGE_KEYS } from '../const/constants';
import { ROUTES, isPublicRoute } from '../routes/paths';
import { toast } from '../store/useToastStore';

const apiClient = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (shouldAttachIdempotencyKey(config.method)) {
      const existingKey = typeof config.headers.get === 'function'
        ? config.headers.get(IDEMPOTENCY_HEADER_NAME)
        : config.headers[IDEMPOTENCY_HEADER_NAME];

      if (!existingKey) {
        if (typeof config.headers.set === 'function') {
          config.headers.set(IDEMPOTENCY_HEADER_NAME, generateIdempotencyKey());
        } else {
          config.headers[IDEMPOTENCY_HEADER_NAME] = generateIdempotencyKey();
        }
      }
    }

    return registerRequest(config);
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token || '');
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    if (response.config) {
      removePendingRequest(response.config);
    }
    return response;
  },
  async (error) => {
    if (error.config) {
      removePendingRequest(error.config);
    }

    if (isRequestCanceled(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const isAccountBlocked = error.response?.data?.error === 'ACCOUNT_BLOCKED';
    if (isAccountBlocked) {
      const reason = error.response?.data?.reason || error.response?.data?.message || 'Violation of platform rules';
      localStorage.setItem(STORAGE_KEYS.BLOCK_REASON, reason);
      window.location.href = ROUTES.BLOCKED;
      return Promise.reject(error);
    }
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        const pathname = window.location.pathname;
        const isPublicPage = isPublicRoute(pathname);

        if (!isPublicPage) {
          const currentUrl = pathname + window.location.search;
          window.location.href = `${ROUTES.LOGIN}?redirect=${encodeURIComponent(currentUrl)}`;
        }
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken, user } = response.data;
        useAuthStore.getState().login(newAccessToken, newRefreshToken, user);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = ROUTES.LOGIN;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const skipToast = (originalRequest as { skipToast?: boolean } | undefined)?.skipToast;
    if (!skipToast && error.response?.status !== 401) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        (error.code === 'ERR_NETWORK' ? 'Network error: please check your connection' : error.message) ||
        'Request failed';
      toast.error(msg);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
