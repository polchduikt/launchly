import React, { useState } from 'react';
import { useBotStore } from '../../../store/useBotStore';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import {
  useLeadsQuery,
  useUpdateLeadMutation,
} from '../hooks/useCrmQueries';
import {
  Loader2,
  AlertCircle,
  Download,
  Users,
} from 'lucide-react';
import type { LeadStatus } from '../../../types/crm';
import { exportExcelApi } from '../../integration/api/integration';

export const ContactsPage: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const botId = activeBotId || 0;
  const { data: leads = [], isLoading: isLeadsLoading } = useLeadsQuery(botId);
  const updateLeadMut = useUpdateLeadMutation(botId);

  const [isExportingLeads, setIsExportingLeads] = useState(false);

  const handleExportExcel = async () => {
    setIsExportingLeads(true);
    try {
      const blob = await exportExcelApi(botId, 'LEADS');
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads_bot_${botId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Excel:', err);
    } finally {
      setIsExportingLeads(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 font-sans">

        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contacts</h1>
            <p className="text-xs text-slate-400">Manage and track your leads</p>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {botId === 0 ? (
            <div className="h-full flex items-center justify-center p-8 text-center">
              <div className="max-w-sm space-y-3">
                <AlertCircle size={40} className="text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No active bot found</p>
                <p className="text-xs text-slate-400">Please connect a bot first to view contacts.</p>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto p-6">
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center select-none">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-indigo-600" />
                    <h2 className="font-bold text-slate-800 text-sm">Leads Contacts</h2>
                  </div>
                  <button
                    onClick={handleExportExcel}
                    disabled={isExportingLeads || leads.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-100 cursor-pointer shadow-sm shadow-indigo-50/50"
                  >
                    {isExportingLeads ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Download size={14} />
                    )}
                    <span>Export to Excel</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
                        <th className="py-3 px-6">Name</th>
                        <th className="py-3 px-6">Email</th>
                        <th className="py-3 px-6">Phone</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Captured At</th>
                        <th className="py-3 px-6">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {isLeadsLoading ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center">
                            <Loader2 className="animate-spin text-indigo-600 mx-auto" size={24} />
                          </td>
                        </tr>
                      ) : leads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                            No leads captured yet.
                          </td>
                        </tr>
                      ) : (
                        leads.map((l) => (
                          <tr key={l.id} className="hover:bg-slate-50/50">
                            <td className="py-4 px-6 font-bold text-slate-900">{l.name}</td>
                            <td className="py-4 px-6">{l.email || '—'}</td>
                            <td className="py-4 px-6">{l.phone || '—'}</td>
                            <td className="py-4 px-6">
                              <select
                                value={l.status}
                                onChange={(e) =>
                                  updateLeadMut.mutate({
                                    leadId: l.id,
                                    status: e.target.value as LeadStatus,
                                    notes: l.notes || '',
                                  })
                                }
                                className={`px-2 py-1 rounded-lg border font-bold text-[10px] cursor-pointer focus:outline-none transition-all ${
                                  l.status === 'NEW'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : l.status === 'CONTACTED'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : l.status === 'QUALIFIED'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : l.status === 'CONVERTED'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                              >
                                <option value="NEW">New</option>
                                <option value="CONTACTED">Contacted</option>
                                <option value="QUALIFIED">Qualified</option>
                                <option value="CONVERTED">Converted</option>
                                <option value="LOST">Lost</option>
                              </select>
                            </td>
                            <td className="py-4 px-6 text-slate-400 text-[11px]">
                              {new Date(l.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <input
                                type="text"
                                defaultValue={l.notes || ''}
                                onBlur={(e) => {
                                  if (e.target.value !== (l.notes || '')) {
                                    updateLeadMut.mutate({
                                      leadId: l.id,
                                      status: l.status,
                                      notes: e.target.value,
                                    });
                                  }
                                }}
                                placeholder="Click to add notes..."
                                className="w-full bg-transparent hover:bg-slate-100/50 focus:bg-white border border-transparent focus:border-slate-200 rounded px-2 py-1 transition-all focus:outline-none placeholder:italic"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
