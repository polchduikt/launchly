import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAdminUsersApi, updateUserRoleApi, toggleUserStatusApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  Users,
  Search,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Bot,
  Loader2,
  X
} from 'lucide-react';
import { t } from '../../../i18n';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER'>('ROLE_OWNER');

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, roleFilter, page],
    queryFn: () => fetchAdminUsersApi(search, roleFilter, page, 15),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) => updateUserRoleApi(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowRoleModal(false);
      setSelectedUser(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (userId: number) => toggleUserStatusApi(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const handleOpenRoleModal = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    if (selectedUser) {
      roleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">


        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('admin.search_users_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Filter size={15} className="text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3.5 py-2 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
            >
              <option value="">{t('admin.all_roles')}</option>
              <option value="ROLE_OWNER">{t('admin.owners')}</option>
              <option value="ROLE_MANAGER">{t('admin.managers')}</option>
              <option value="ROLE_ADMIN">{t('admin.admins')}</option>
            </select>
          </div>
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
                    <th className="py-4 px-5">{t('admin.user_col')}</th>
                    <th className="py-4 px-5">{t('admin.role_col')}</th>
                    <th className="py-4 px-5">{t('admin.provider_col')}</th>
                    <th className="py-4 px-5">{t('admin.bots_col')}</th>
                    <th className="py-4 px-5">{t('admin.status_col')}</th>
                    <th className="py-4 px-5 text-right">{t('admin.actions_col')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.content?.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center space-x-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs">
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-xs">{u.name}</span>
                              <span className="text-slate-500 text-[11px] font-medium">{u.email}</span>
                              {u.telegramUsername && (
                                <span className="text-cyan-600 text-[10px] font-mono">@{u.telegramUsername}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          {u.role === 'ROLE_ADMIN' && (
                            <span className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-[10px]">
                              Super Admin
                            </span>
                          )}
                          {u.role === 'ROLE_MANAGER' && (
                            <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[10px]">
                              Manager
                            </span>
                          )}
                          {u.role === 'ROLE_OWNER' && (
                            <span className="px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-[10px]">
                              Owner
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-slate-500 uppercase font-mono text-[10px] font-bold">
                          {u.provider || 'LOCAL'}
                        </td>

                        <td className="py-3.5 px-5">
                          <div className="flex items-center space-x-1.5 text-slate-700 font-mono font-bold">
                            <Bot size={14} className="text-indigo-600" />
                            <span>{u.botsCount || 0}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          {u.active ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                              Blocked
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {isAdmin && (
                              <button
                                onClick={() => handleOpenRoleModal(u)}
                                disabled={isSelf}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] font-bold text-slate-700 disabled:opacity-40 transition cursor-pointer"
                              >
                                {t('admin.edit_role')}
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => statusMutation.mutate(u.id)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-xl border transition cursor-pointer disabled:opacity-40 ${
                                  u.active
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={u.active ? 'Block User' : 'Unblock User'}
                              >
                                {u.active ? <UserX size={15} /> : <UserCheck size={15} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 backdrop-blur-sm p-4">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Shield size={20} className="text-indigo-600" />
                  <span>{t('admin.change_role_title')}</span>
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-slate-500 font-medium">
                  User: <strong className="text-slate-900 font-bold">{selectedUser.email}</strong>
                </p>

                <div className="space-y-2.5">
                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    newRole === 'ROLE_OWNER' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="role"
                        value="ROLE_OWNER"
                        checked={newRole === 'ROLE_OWNER'}
                        onChange={() => setNewRole('ROLE_OWNER')}
                        className="accent-indigo-600"
                      />
                      <span className="text-xs">{t('admin.owners')}</span>
                    </div>
                  </label>

                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    newRole === 'ROLE_MANAGER' ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="role"
                        value="ROLE_MANAGER"
                        checked={newRole === 'ROLE_MANAGER'}
                        onChange={() => setNewRole('ROLE_MANAGER')}
                        className="accent-blue-600"
                      />
                      <span className="text-xs">{t('admin.managers')}</span>
                    </div>
                  </label>

                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                    newRole === 'ROLE_ADMIN' ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="role"
                        value="ROLE_ADMIN"
                        checked={newRole === 'ROLE_ADMIN'}
                        onChange={() => setNewRole('ROLE_ADMIN')}
                        className="accent-purple-600"
                      />
                      <span className="text-xs">{t('admin.admins')}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={roleMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {roleMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{t('admin.save_role')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
