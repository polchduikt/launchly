import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  createdAt: number;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, duration?: number) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
}

let toastCounter = 0;
const DEDUPLICATION_WINDOW_MS = 1500;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (type, message, duration = 4000) => {
    const trimmed = typeof message === 'string' ? message.trim() : String(message);
    if (!trimmed) return '';

    const now = Date.now();
    const existing = get().toasts.find(
      (t) => t.message === trimmed && t.type === type && now - t.createdAt < DEDUPLICATION_WINDOW_MS
    );
    if (existing) {
      return existing.id;
    }

    toastCounter += 1;
    const id = `toast-${now}-${toastCounter}`;
    const newToast: ToastItem = {
      id,
      type,
      message: trimmed,
      duration,
      createdAt: now,
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().showToast('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().showToast('error', message, duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().showToast('info', message, duration),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().showToast('warning', message, duration),
  dismiss: (id: string) => useToastStore.getState().dismissToast(id),
  clear: () => useToastStore.getState().clearToasts(),
};
