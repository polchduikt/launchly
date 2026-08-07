import apiClient from './axios';
import type { PlanResponse, SubscriptionResponse, CheckoutResponse } from '../types';

export const getPlansApi = async (): Promise<PlanResponse[]> => {
  const response = await apiClient.get<PlanResponse[]>('/billing/plans');
  return response.data;
};

export const getSubscriptionApi = async (): Promise<SubscriptionResponse> => {
  const response = await apiClient.get<SubscriptionResponse>('/billing/subscription');
  return response.data;
};

export const checkoutApi = async (planId: number): Promise<CheckoutResponse> => {
  const response = await apiClient.post<CheckoutResponse>('/billing/subscription/checkout', { planId });
  return response.data;
};

export const cancelSubscriptionApi = async (): Promise<SubscriptionResponse> => {
  const response = await apiClient.post<SubscriptionResponse>('/billing/subscription/cancel');
  return response.data;
};

export const resumeSubscriptionApi = async (): Promise<SubscriptionResponse> => {
  const response = await apiClient.post<SubscriptionResponse>('/billing/subscription/resume');
  return response.data;
};

export const confirmSessionApi = async (sessionId: string): Promise<SubscriptionResponse> => {
  const response = await apiClient.post<SubscriptionResponse>('/billing/subscription/confirm-session', { sessionId });
  return response.data;
};
