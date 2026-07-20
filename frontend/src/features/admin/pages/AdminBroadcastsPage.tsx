import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminBroadcastsApi, createAdminBroadcastApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { Radio, Send, Users, CheckCircle2, Loader2, Plus, X } from 'lucide-react';
import { t } from '../../../i18n';

export const AdminBroadcastsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL_USERS');

  const { data: broadcasts = [], isLoading } = useQuery({
    queryKey: ['adminBroadcasts'],
    queryFn: fetchAdminBroadcastsApi,
  });

  const createMutation = useMutation({
    mutationFn: createAdminBroadcastApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBroadcasts'] });
      setShowCreateModal(false);
      setTitle('');
      setContent('');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate({ title, content, targetAudience });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1300px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Radio className="text-indigo-600" size={24} />
              <span>{t('admin.broadcasts_title')}</span>
            </h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-indigo-100 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>{t('admin.create_broadcast_btn')}</span>
          </button>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="py-4 px-5">{t('admin.title_col')}</th>
                    <th className="py-4 px-5">{t('admin.audience_col')}</th>
                    <th className="py-4 px-5">{t('admin.delivered_col')}</th>
                    <th className="py-4 px-5">{t('admin.created_by_col')}</th>
                    <th className="py-4 px-5">{t('admin.date_col')}</th>
                    <th className="py-4 px-5 text-right">{t('admin.status_col')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {broadcasts.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">{b.title}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1 font-medium">{b.content}</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                          <Users size={12} className="mr-1 text-indigo-600" />
                          <span>{b.targetAudience}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 font-mono font-bold text-slate-800">
                        {b.sentCount}
                      </td>

                      <td className="py-4 px-5 text-slate-500 font-medium">
                        {b.createdByEmail}
                      </td>

                      <td className="py-4 px-5 text-slate-500 font-mono text-[11px] font-bold">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <span className="inline-flex items-center text-emerald-600 text-[11px] font-mono font-bold">
                          <CheckCircle2 size={14} className="mr-1" />
                          <span>{b.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm p-4">
            <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Radio size={20} className="text-indigo-600" />
                  <span>{t('admin.create_broadcast_btn')}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Title:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Platform Maintenance Announcement"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Target Audience:
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="ALL_USERS">All Users</option>
                    <option value="OWNERS_ONLY">Owners Only</option>
                    <option value="ACTIVE_BOT_OWNERS">Active Bot Owners</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Message Content:
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Type announcement content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>{t('admin.send_broadcast')}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBroadcastsPage;
