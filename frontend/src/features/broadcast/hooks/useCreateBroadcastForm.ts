import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { useCreateCampaignMutation } from './useBroadcastQueries';
import type { CreateCampaignRequest } from '../types';

export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  message: z.string().min(1, 'Message text is required'),
  filterType: z.enum(['ALL', 'BY_TAG', 'HAS_ORDERS', 'HAS_LEADS']),
  filterValue: z.string().optional(),
  scheduledAt: z.string().optional(),
}).refine((data) => {
  if (data.filterType === 'BY_TAG' && !data.filterValue) {
    return false;
  }
  return true;
}, {
  message: 'Tag name is required when filtering by tag',
  path: ['filterValue'],
});

export type CreateCampaignFields = z.infer<typeof createCampaignSchema>;

export const useCreateBroadcastForm = (botId: number, onSuccessCallback?: () => void) => {
  const navigate = useNavigate();
  const createCampaignMut = useCreateCampaignMutation(botId);

  const form = useForm<CreateCampaignFields>({
    resolver: zodResolver(createCampaignSchema),
    defaultValues: {
      name: '',
      message: '',
      filterType: 'ALL',
      filterValue: '',
      scheduledAt: '',
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    const payload: CreateCampaignRequest = {
      name: data.name,
      message: data.message,
      filterType: data.filterType,
      filterValue: data.filterType === 'BY_TAG' ? data.filterValue : undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
    };

    createCampaignMut.mutate(payload, {
      onSuccess: (campaign) => {
        form.reset();
        if (onSuccessCallback) {
          onSuccessCallback();
        }
        navigate(ROUTES.BROADCAST_BUILDER.replace(':id', String(campaign.id)));
      },
    });
  });

  return {
    form,
    onSubmit,
    isPending: createCampaignMut.isPending,
    error: createCampaignMut.error,
  };
};
