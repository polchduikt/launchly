import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPlansApi,
  getSubscriptionApi,
  checkoutApi,
  cancelSubscriptionApi,
  resumeSubscriptionApi,
} from '../api/billing';

export const usePlansQuery = () => {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: getPlansApi,
  });
};

export const useSubscriptionQuery = () => {
  return useQuery({
    queryKey: ['billing-subscription'],
    queryFn: getSubscriptionApi,
  });
};

export const useCheckoutMutation = () => {
  return useMutation({
    mutationFn: (planId: number) => checkoutApi(planId),
  });
};

export const useCancelSubscriptionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscriptionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
    },
  });
};

export const useResumeSubscriptionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resumeSubscriptionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-subscription'] });
    },
  });
};
