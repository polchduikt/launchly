import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routes/paths';
import { useCreateCampaignMutation } from './useBroadcastQueries';
import type { CreateCampaignRequest } from '../../types';

import { createBroadcastSchema } from '../../schemas/broadcast.schema';
import type { CreateBroadcastSchemaType } from '../../schemas/broadcast.schema';

export const createCampaignSchema = createBroadcastSchema;
export type CreateCampaignFields = CreateBroadcastSchemaType;

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
