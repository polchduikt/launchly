import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  useUpdateIntegrationMutation,
  useToggleIntegrationMutation,
  useDeleteIntegrationMutation,
} from '../hooks/useIntegrationQueries';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  FileSpreadsheet,
  Loader2,
  Trash2,
  RefreshCw,
  Power,
  Link,
} from 'lucide-react';
import type { IntegrationResponse, GoogleSheetsConfig } from '../types';

interface GoogleSheetsCardProps {
  botId: number;
  integration: IntegrationResponse | undefined;
}

const googleSheetsSchema = z.object({
  spreadsheetId: z.string().min(1, 'Spreadsheet ID is required'),
  sheetName: z.string().min(1, 'Sheet Name is required'),
  dataType: z.enum(['ORDERS', 'LEADS']),
});

type GoogleSheetsFields = z.infer<typeof googleSheetsSchema>;

export const GoogleSheetsCard: React.FC<GoogleSheetsCardProps> = ({ botId, integration }) => {
  const updateMut = useUpdateIntegrationMutation();
  const toggleMut = useToggleIntegrationMutation();
  const deleteMut = useDeleteIntegrationMutation();

  const googleConfig = integration?.config as GoogleSheetsConfig | null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoogleSheetsFields>({
    resolver: zodResolver(googleSheetsSchema),
    defaultValues: {
      spreadsheetId: '',
      sheetName: 'Sheet1',
      dataType: 'LEADS',
    },
  });

  useEffect(() => {
    if (googleConfig) {
      reset({
        spreadsheetId: googleConfig.spreadsheetId || '',
        sheetName: googleConfig.sheetName || 'Sheet1',
        dataType: googleConfig.dataType || 'LEADS',
      });
    }
  }, [googleConfig, reset]);

  const handleConnectGoogle = () => {
    const token = useAuthStore.getState().accessToken;
    window.location.href = `/api/v1/integrations/google/auth?botId=${botId}&token=${token}`;
  };

  const onSave = (data: GoogleSheetsFields) => {
    if (integration) {
      updateMut.mutate({
        id: integration.id,
        request: {
          name: 'Google Sheets',
          type: 'GOOGLE_SHEETS',
          botId,
          config: data,
        },
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

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm">
            <FileSpreadsheet size={20} />
          </span>
          <div>
            <h3 className="font-bold text-sm text-slate-800">Google Sheets Integration</h3>
            <p className="text-xs text-slate-400">Stream subscriber leads and orders directly to sheets</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              integration
                ? integration.active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
          >
            {integration
              ? integration.active
                ? 'Connected'
                : 'Disabled'
              : 'Not Connected'}
          </span>
        </div>
      </div>

      {!integration ? (
        <div className="space-y-4 max-w-xl">
          <p className="text-xs text-slate-500 leading-relaxed">
            Link your bot to a Google account to append CRM updates automatically. Launchly creates formatted rows when customers purchase a product or register their contact info.
          </p>
          <button
            onClick={handleConnectGoogle}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow shadow-emerald-100 cursor-pointer"
          >
            <Link size={14} />
            <span>Connect Google Account</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSave)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Spreadsheet ID
              </label>
              <input
                type="text"
                placeholder="e.g. 1a2b3c4d5e6f7g..."
                {...register('spreadsheetId')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all bg-slate-50/20"
              />
              {errors.spreadsheetId && (
                <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                  {errors.spreadsheetId.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Sheet Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sheet1"
                {...register('sheetName')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all bg-slate-50/20"
              />
              {errors.sheetName && (
                <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                  {errors.sheetName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Export Data Type
            </label>
            <select
              {...register('dataType')}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 transition-all bg-white cursor-pointer"
            >
              <option value="LEADS">Leads Contacts</option>
              <option value="ORDERS">Product Orders</option>
            </select>
            {errors.dataType && (
              <p className="text-[10px] text-rose-500 mt-1 font-semibold">
                {errors.dataType.message}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={updateMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow shadow-emerald-50 cursor-pointer"
            >
              {updateMut.isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <span>Save Settings</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleToggle}
              disabled={toggleMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
            >
              <Power size={14} />
              <span>{integration.active ? 'Disable' : 'Enable'}</span>
            </button>

            <button
              type="button"
              onClick={handleConnectGoogle}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Reconnect Google</span>
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all border border-rose-100 cursor-pointer ml-auto"
            >
              <Trash2 size={14} />
              <span>Disconnect</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
