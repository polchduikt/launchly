import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { t } from '../../../i18n/config';
import {
  useCreateIntegrationMutation,
  useUpdateIntegrationMutation,
  useToggleIntegrationMutation,
  useDeleteIntegrationMutation,
} from '../hooks/useIntegrationQueries';
import { Globe, Loader2, Power, Trash2 } from 'lucide-react';
import type { IntegrationResponse, WebhookConfig } from '../types';

interface WebhookCardProps {
  botId: number;
  integration: IntegrationResponse | undefined;
}

type WebhookFields = {
  url: string;
  events: ('ORDER_CREATED' | 'LEAD_CREATED')[];
  secret?: string;
};

export const WebhookCard: React.FC<WebhookCardProps> = ({ botId, integration }) => {
  const createMut = useCreateIntegrationMutation();
  const updateMut = useUpdateIntegrationMutation();
  const toggleMut = useToggleIntegrationMutation();
  const deleteMut = useDeleteIntegrationMutation();

  const webhookSchema = z.object({
    url: z
      .string()
      .url(t('settings.integrations.webhook.error_url'))
      .regex(/^https?:\/\/.*/, t('settings.integrations.webhook.error_url_prefix')),
    events: z.array(z.enum(['ORDER_CREATED', 'LEAD_CREATED'])).min(1, t('settings.integrations.webhook.error_events')),
    secret: z.string().optional(),
  });

  const webhookConfig = integration?.config as WebhookConfig | null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WebhookFields>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: '',
      events: [],
      secret: '',
    },
  });

  useEffect(() => {
    if (webhookConfig) {
      reset({
        url: webhookConfig.url || '',
        events: webhookConfig.events || [],
        secret: webhookConfig.secret || '',
      });
    }
  }, [webhookConfig, reset]);

  const onSave = (data: WebhookFields) => {
    if (integration) {
      updateMut.mutate({
        id: integration.id,
        request: {
          name: 'Webhook URL',
          type: 'WEBHOOK',
          botId,
          config: data,
        },
      });
    } else {
      createMut.mutate({
        name: 'Webhook URL',
        type: 'WEBHOOK',
        botId,
        config: data,
      });
    }
  };

  const handleToggle = () => {
    if (integration) {
      toggleMut.mutate(integration.id);
    }
  };

  const handleDelete = () => {
    if (integration) {
      deleteMut.mutate(integration.id);
    }
  };

  const activeWebhookEvents = watch('events') || [];

  const handleEventCheckboxChange = (event: 'ORDER_CREATED' | 'LEAD_CREATED', checked: boolean) => {
    if (checked) {
      setValue('events', [...activeWebhookEvents, event]);
    } else {
      setValue(
        'events',
        activeWebhookEvents.filter((e) => e !== event)
      );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
            <Globe size={20} />
          </span>
          <div>
            <h3 className="font-bold text-sm text-slate-800">{t('settings.integrations.webhook.title')}</h3>
            <p className="text-xs text-slate-400">{t('settings.integrations.webhook.desc')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              integration
                ? integration.active
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            {integration
              ? integration.active
                ? t('settings.integrations.webhook.status_active')
                : t('settings.integrations.webhook.status_disabled')
              : t('settings.integrations.webhook.status_not_set')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSave)} className="space-y-5">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('settings.integrations.webhook.url_label')}
          </label>
          <input
            type="text"
            placeholder={t('settings.integrations.webhook.url_placeholder')}
            {...register('url')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all bg-slate-50/20 font-mono text-xs"
          />
          {errors.url && (
            <p className="text-[10px] text-rose-500 mt-1 font-semibold">
              {errors.url.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('settings.integrations.webhook.secret_label')}
          </label>
          <input
            type="password"
            placeholder={t('settings.integrations.webhook.secret_placeholder')}
            {...register('secret')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 transition-all bg-slate-50/20 font-mono text-xs"
          />
          {errors.secret && (
            <p className="text-[10px] text-rose-500 mt-1 font-semibold">
              {errors.secret.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            {t('settings.integrations.webhook.events_label')}
          </span>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={activeWebhookEvents.includes('ORDER_CREATED')}
                onChange={(e) =>
                  handleEventCheckboxChange('ORDER_CREATED', e.target.checked)
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>{t('settings.integrations.webhook.event_order')}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={activeWebhookEvents.includes('LEAD_CREATED')}
                onChange={(e) =>
                  handleEventCheckboxChange('LEAD_CREATED', e.target.checked)
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span>{t('settings.integrations.webhook.event_lead')}</span>
            </label>
          </div>
          {errors.events && (
            <p className="text-[10px] text-rose-500 mt-1 font-semibold">
              {errors.events.message}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
          <button
            type="submit"
            disabled={createMut.isPending || updateMut.isPending}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow shadow-indigo-50 cursor-pointer"
          >
            {createMut.isPending || updateMut.isPending ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <span>{t('settings.integrations.webhook.btn_save')}</span>
            )}
          </button>

          {integration && (
            <>
              <button
                type="button"
                onClick={handleToggle}
                disabled={toggleMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
              >
                <Power size={14} />
                <span>{integration.active ? t('settings.integrations.webhook.btn_disable') : t('settings.integrations.webhook.btn_enable')}</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMut.isPending}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all border border-rose-100 cursor-pointer ml-auto"
              >
                <Trash2 size={14} />
                <span>{t('settings.integrations.webhook.btn_remove')}</span>
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};
