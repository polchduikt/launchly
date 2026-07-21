import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminAutomationsApi, toggleAutomationApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { Workflow, Bot, Play, Pause, Loader2 } from 'lucide-react';
import { t } from '../../../i18n';

export const AdminAutomationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ['adminAutomations'],
    queryFn: fetchAdminAutomationsApi,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => toggleAutomationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAutomations'] });
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">


        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-5">{t('admin.flow_schema_col')}</th>
                    <th className="py-4 px-5">{t('admin.owner_col')}</th>
                    <th className="py-4 px-5">{t('admin.target_bot_col')}</th>
                    <th className="py-4 px-5">{t('admin.executions_col')}</th>
                    <th className="py-4 px-5">{t('admin.errors_col')}</th>
                    <th className="py-4 px-5">{t('admin.status_col')}</th>
                    {isAdmin && <th className="py-4 px-5 text-right">{t('admin.actions_col')}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {automations.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{item.name}</span>
                          <span className="text-[10px] font-bold text-indigo-600 font-mono">Trigger: {item.triggerType}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-semibold">{item.ownerName}</span>
                          <span className="text-slate-400 text-[11px] font-medium">{item.ownerEmail}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                          <Bot size={15} className="text-indigo-600" />
                          <span>{item.botName}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono font-bold text-slate-800">
                        {item.triggerCount}
                      </td>

                      <td className="py-4 px-5">
                        {item.errorCount > 0 ? (
                          <span className="inline-flex items-center space-x-1 text-red-600 font-bold bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-[10px]">
                            <span>{item.errorCount} errors</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono font-bold text-[11px]">0</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {item.active ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            Paused
                          </span>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => toggleMutation.mutate(item.id)}
                            className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                              item.active
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={item.active ? 'Pause Automation' : 'Resume Automation'}
                          >
                            {item.active ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAutomationsPage;
