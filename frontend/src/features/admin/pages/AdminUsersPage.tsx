import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchAdminUsersApi, updateUserRoleApi, toggleUserStatusApi, fetchAdminUserDetailsApi } from '../api/adminApi';
import { AdminLayout } from '../layouts/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../constants/routes';
import {
  Search,
  ChevronDown,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Bot,
  Calendar,
  Filter,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Workflow,
  Send,
  Users,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { t } from '../../../i18n';

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    const param = searchParams.get('search');
    if (param !== null) {
      setSearch(param);
      setPage(0);
    }
  }, [searchParams]);

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER'>('ROLE_OWNER');

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState<any | null>(null);
  const [blockReasonOption, setBlockReasonOption] = useState<string>('SUSPICIOUS_ACTIVITY');
  const [customBlockReason, setCustomBlockReason] = useState<string>('');

  const [selectedDetailUser, setSelectedDetailUser] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'automations' | 'broadcasts' | 'system'>('all');
  const [activityPage, setActivityPage] = useState(0);

  const { data: userDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminUserDetails', selectedDetailUser?.id, detailPeriod, activityCategoryFilter, activityPage],
    queryFn: () => fetchAdminUserDetailsApi(selectedDetailUser.id, detailPeriod, activityCategoryFilter, activityPage, 20),
    enabled: !!selectedDetailUser && showDetailModal
  });

  const handleOpenDetailModal = (user: any) => {
    setSelectedDetailUser(user);
    setActivityPage(0);
    setShowDetailModal(true);
  };

  const formatEuroDateTime = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year}, ${hours}:${minutes}:${seconds}`;
  };

  const translateAuditTitle = (title: string) => {
    if (!title) return '';
    if (title.startsWith('Реєстрація у Launchly') || title.startsWith('Registered in Launchly')) {
      return t('audit.user_registration.title');
    }
    if (title.startsWith('Авторизація користувача') || title.startsWith('User Authentication')) {
      return t('audit.user_auth.title');
    }
    if (title.startsWith('Підключення бота:') || title.startsWith('Bot Connected:')) {
      const name = title.split(':')[1]?.trim() || '';
      return t('audit.bot_connected.title', { botName: name });
    }
    if (title.startsWith('Модифікація автоматизації:') || title.startsWith('Automation Modified:')) {
      const name = title.split(':')[1]?.trim() || '';
      return t('audit.automation_modified.title', { botName: name });
    }
    if (title.startsWith('Запуск розсилки') || title.startsWith('Broadcast Launched')) {
      return t('audit.broadcast_launched.title');
    }
    if (title.startsWith('Права доступу та роль') || title.startsWith('Access Rights & Role')) {
      return t('audit.access_role.title');
    }
    if (title.startsWith('Адміністративне блокування') || title.startsWith('Administrative Block')) {
      return t('audit.admin_block.title');
    }
    if (title.startsWith('Адміністративне розблокування') || title.startsWith('Administrative Unblock')) {
      return t('audit.admin_unblock.title');
    }
    return title;
  };

  const translateAuditDescription = (desc: string) => {
    if (!desc) return '';
    if (desc.startsWith('Обліковий запис активовано через') || desc.startsWith('Account activated via')) {
      const parts = desc.split(/через|via/);
      const prov = parts[1]?.trim() || 'LOCAL';
      return t('audit.user_registration.desc', { provider: prov });
    }
    if (desc.startsWith('Успішна сесія авторизації в системі через Google OAuth') || desc.startsWith('Successful authentication session via Google OAuth')) {
      return t('audit.user_auth_oauth.desc');
    }
    if (desc.startsWith('Успішна сесія авторизації') || desc.startsWith('Successful authentication session')) {
      return t('audit.user_auth.desc');
    }
    if (desc.includes('Створено та активовано бота') || desc.includes('Created and activated bot') || desc.includes('Bot ID:')) {
      const match = desc.match(/Bot ID:\s*#?(\d+)/i);
      const botId = match ? match[1] : '';
      return t('audit.bot_connected.desc', { botId });
    }
    if (desc.includes('Оновлено структуру бот-схеми') || desc.includes('Updated flow schema')) {
      return t('audit.automation_modified.desc');
    }
    if (desc.includes('Створено розсилку') || desc.includes('Created broadcast')) {
      const nameMatch = desc.match(/['"](.*?)['"]/);
      const statusMatch = desc.match(/Статус:\s*(\w+)|Status:\s*(\w+)/i);
      const name = nameMatch ? nameMatch[1] : '';
      const status = statusMatch ? (statusMatch[1] || statusMatch[2]) : 'ACTIVE';
      return t('audit.broadcast_launched.desc', { name, status });
    }
    if (desc.startsWith('Причина:') || desc.startsWith('Reason:')) {
      const reasonStr = desc.replace('Причина:', '').replace('Reason:', '').trim();
      return `${t('blocked.reason_title')} ${reasonStr}`;
    }
    if (desc.startsWith('Акаунт відновлено') || desc.startsWith('Account restored')) {
      return t('audit.admin_unblock.desc');
    }
    return desc;
  };

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleOptions = [
    { value: '', label: t('admin.all_roles') !== 'admin.all_roles' ? t('admin.all_roles') : 'Всі ролі' },
    { value: 'ROLE_OWNER', label: t('admin.owners') !== 'admin.owners' ? t('admin.owners') : 'Овнер' },
    { value: 'ROLE_MANAGER', label: t('admin.managers') !== 'admin.managers' ? t('admin.managers') : 'Менеджер' },
    { value: 'ROLE_ADMIN', label: t('admin.admins') !== 'admin.admins' ? t('admin.admins') : 'Адмін' },
  ];

  const getRoleLabel = (role: string) => {
    const found = roleOptions.find((r) => r.value === role);
    return found ? found.label : (t('admin.all_roles') !== 'admin.all_roles' ? t('admin.all_roles') : 'Всі ролі');
  };

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, roleFilter, page],
    queryFn: () => fetchAdminUsersApi(search, roleFilter, page, 30),
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
    mutationFn: ({ userId, blockData }: { userId: number; blockData?: { reason: string; details?: string } }) =>
      toggleUserStatusApi(userId, blockData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setShowBlockModal(false);
      setUserToBlock(null);
      setCustomBlockReason('');
    },
  });

  const handleOpenRoleModal = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleOpenBlockModal = (user: any) => {
    if (user.active) {
      setUserToBlock(user);
      setBlockReasonOption('SUSPICIOUS_ACTIVITY');
      setCustomBlockReason('');
      setShowBlockModal(true);
    } else {
      statusMutation.mutate({ userId: user.id });
    }
  };

  const handleConfirmBlock = () => {
    if (userToBlock) {
      statusMutation.mutate({
        userId: userToBlock.id,
        blockData: {
          reason: blockReasonOption,
          details: customBlockReason
        }
      });
    }
  };

  const handleSaveRole = () => {
    if (selectedUser) {
      roleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 w-full">

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between w-full">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder={t('admin.search_users_placeholder') !== 'admin.search_users_placeholder' ? t('admin.search_users_placeholder') : 'Пошук пошти, імені або Telegram...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-all shadow-xs"
            />
          </div>

          <div className="relative w-full sm:w-auto flex justify-end" ref={roleDropdownRef}>
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center justify-between gap-2.5 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-98 transition-all shadow-xs min-w-[140px] cursor-pointer"
            >
              <span>{getRoleLabel(roleFilter)}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setRoleFilter(opt.value);
                      setPage(0);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                      roleFilter === opt.value
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
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
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-4 px-4">{t('admin.user_col')}</th>
                    <th className="py-4 px-4">{t('admin.role_col')}</th>
                    <th className="py-4 px-4">{t('admin.provider_col')}</th>
                    <th className="py-4 px-4 text-center">{t('admin.bots_col')}</th>
                    <th className="py-4 px-4 text-center">{t('admin.cat_automations')}</th>
                    <th className="py-4 px-4 text-center">{t('admin.cat_broadcasts')}</th>
                    <th className="py-4 px-4 text-center">{t('admin.subscribers')}</th>
                    <th className="py-4 px-4 text-center">{t('admin.messages_sent')}</th>
                    <th className="py-4 px-4 text-center">{t('admin.subscription_plan')}</th>
                    <th className="py-4 px-4 text-center">{t('admin.status_col')}</th>
                    <th className="py-4 px-4 text-right">{t('admin.actions_col')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.content?.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div
                            onClick={() => handleOpenDetailModal(u)}
                            className="flex items-center space-x-3 cursor-pointer group"
                            title="Переглянути деталі та статистику користувача"
                          >
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs group-hover:border-indigo-400 transition" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-extrabold text-indigo-700 text-xs shadow-xs group-hover:bg-indigo-600 group-hover:text-white transition">
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition">{u.name}</span>
                              <span className="text-slate-500 text-[11px] font-medium">{u.email}</span>
                              {u.telegramUsername && (
                                <span className="text-cyan-600 text-[10px] font-mono">@{u.telegramUsername}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {u.role === 'ROLE_ADMIN' && (
                            <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-extrabold text-[10px]">
                              Super Admin
                            </span>
                          )}
                          {u.role === 'ROLE_MANAGER' && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-[10px]">
                              Manager
                            </span>
                          )}
                          {u.role === 'ROLE_OWNER' && (
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-extrabold text-[10px]">
                              Owner
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 uppercase font-mono text-[10px] font-bold">
                          {(() => {
                            const main = u.provider || 'LOCAL';
                            if (main === 'TELEGRAM') return 'TELEGRAM';
                            return u.telegramUsername ? `${main}, TELEGRAM` : main;
                          })()}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-mono font-bold">
                            <Bot size={13} className="text-indigo-600" />
                            <span>{u.botsCount || 0}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-mono font-bold">
                            <Workflow size={13} className="text-purple-600" />
                            <span>{u.automationsCount || 0}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-mono font-bold">
                            <Send size={13} className="text-blue-600" />
                            <span>{u.broadcastsCount || 0}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-mono font-bold">
                            <Users size={13} className="text-emerald-600" />
                            <span>{u.contactsCount || 0}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5 text-slate-700 font-mono font-bold">
                            <MessageSquare size={13} className="text-cyan-600" />
                            <span>{u.messagesCount || 0}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px]">
                            <Sparkles size={11} className="mr-1 text-indigo-600" />
                            {u.planName || 'FREE'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {u.active ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
                              {t('admin.active')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
                              {t('admin.blocked')}
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
                                onClick={() => handleOpenBlockModal(u)}
                                disabled={isSelf}
                                className={`p-1.5 rounded-xl border transition cursor-pointer disabled:opacity-40 ${
                                  u.active
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                }`}
                                title={u.active ? t('admin.block') : t('admin.unblock')}
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 font-medium">
                <div>
                  {t('admin.showing') !== 'admin.showing' ? t('admin.showing') : 'Показано'} <span className="font-bold text-slate-900">{data?.content?.length || 0}</span> {t('admin.of') !== 'admin.of' ? t('admin.of') : 'з'} <span className="font-bold text-slate-900">{data?.totalElements || 0}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                    disabled={page === 0}
                    className="flex items-center space-x-1 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev') !== 'admin.prev' ? t('admin.prev') : 'Назад'}</span>
                  </button>

                  <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono text-slate-800 shadow-2xs">
                    <span className="text-indigo-600">{page + 1}</span>
                    <span className="text-slate-400">/</span>
                    <span>{data?.totalPages || 1}</span>
                  </div>

                  <button
                    onClick={() => setPage((prev) => Math.min(prev + 1, (data?.totalPages || 1) - 1))}
                    disabled={!data || page >= data.totalPages - 1}
                    className="flex items-center space-x-1 px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs cursor-pointer"
                  >
                    <span>{t('admin.next') !== 'admin.next' ? t('admin.next') : 'Далі'}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 animate-in fade-in duration-150">
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

        {showBlockModal && userToBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={20} className="text-rose-600" />
                  <span>{t('admin.block_user_title')}</span>
                </h3>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div>User: <strong className="text-slate-900 font-bold">{userToBlock.name}</strong></div>
                  <div className="text-slate-500">{userToBlock.email}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">{t('admin.select_block_reason')}</label>
                  {[
                    { code: 'SUSPICIOUS_ACTIVITY', key: 'admin.reason_suspicious' },
                    { code: 'VIOLATION_OF_RULES', key: 'admin.reason_rules' },
                    { code: 'SPAM', key: 'admin.reason_spam' },
                    { code: 'OTHER', key: 'admin.reason_other' }
                  ].map((r) => (
                    <label
                      key={r.code}
                      onClick={() => setBlockReasonOption(r.code)}
                      className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                        blockReasonOption === r.code
                          ? 'bg-rose-50 border-rose-400 text-rose-900 font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="blockReason"
                        checked={blockReasonOption === r.code}
                        onChange={() => setBlockReasonOption(r.code)}
                        className="accent-rose-600"
                      />
                      <span className="text-xs">{t(r.key)}</span>
                    </label>
                  ))}
                </div>

                {blockReasonOption === 'OTHER' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700 block">{t('admin.specify_block_reason')}</label>
                    <textarea
                      value={customBlockReason}
                      onChange={(e) => setCustomBlockReason(e.target.value)}
                      placeholder="..."
                      rows={3}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white transition"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleConfirmBlock}
                  disabled={statusMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-100 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {statusMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{t('admin.confirm_block')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedDetailUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-150">
            <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-4xl h-[710px] p-6 sm:p-7 shadow-2xl flex flex-col justify-between space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3.5 shrink-0">
                <div className="flex items-center space-x-3.5">
                  {selectedDetailUser.avatar ? (
                    <img
                      src={selectedDetailUser.avatar}
                      alt={selectedDetailUser.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-lg">
                      {selectedDetailUser.name ? selectedDetailUser.name[0].toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">{selectedDetailUser.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] uppercase">
                        {selectedDetailUser.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        selectedDetailUser.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {selectedDetailUser.active ? t('admin.active') : t('admin.blocked')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 font-mono flex items-center space-x-2">
                      <span>{selectedDetailUser.email}</span>
                      {selectedDetailUser.telegramUsername && (
                        <span className="text-cyan-700">@{selectedDetailUser.telegramUsername}</span>
                      )}
                      <span>ID: #{selectedDetailUser.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenRoleModal(selectedDetailUser);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition cursor-pointer"
                    >
                      {t('admin.role')}
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleOpenBlockModal(selectedDetailUser);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        selectedDetailUser.active
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {selectedDetailUser.active ? t('admin.block') : t('admin.unblock')}
                    </button>
                  )}

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 shrink-0">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
                    <Calendar size={13} />
                    {t('admin.period_label')}
                  </span>
                  {[
                    { id: 'week', label: t('admin.7_days') },
                    { id: 'month', label: t('admin.30_days') },
                    { id: '3months', label: t('admin.90_days') },
                    { id: 'all', label: t('admin.all_time') }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setDetailPeriod(p.id as any);
                        setActivityPage(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        detailPeriod === p.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-1 flex items-center gap-1">
                    <Filter size={13} />
                    {t('admin.category_label')}
                  </span>
                  {[
                    { id: 'all', label: t('admin.cat_all') },
                    { id: 'automations', label: t('admin.cat_automations') },
                    { id: 'broadcasts', label: t('admin.cat_broadcasts') },
                    { id: 'system', label: t('admin.cat_system') }
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActivityCategoryFilter(c.id as any);
                        setActivityPage(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activityCategoryFilter === c.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 shrink-0">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.active_bots')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.botsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.cat_automations')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.automationsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.cat_broadcasts')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.broadcastsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.subscribers')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.contactsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.messages_sent')}</div>
                  <div className="text-base font-extrabold text-slate-900 mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.messagesCount ?? 0)}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('admin.subscription_plan')}</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {isDetailLoading ? '...' : (userDetailData?.planName || 'FREE')}
                  </div>
                </div>
              </div>

              {!selectedDetailUser.active && selectedDetailUser.blockReason && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-800 shrink-0">
                  <span className="font-bold">{t('blocked.reason_title')}</span> {selectedDetailUser.blockReason}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
                <div className="md:col-span-5 border border-slate-200 rounded-xl bg-slate-50/50 p-3 flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-700 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span>{t('admin.automations')}</span>
                    </div>
                    {userDetailData?.automations && (
                      <span className="text-[11px] font-mono text-slate-500 font-normal">
                        {t('admin.total')}: {userDetailData.automations.length}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                    {isDetailLoading ? (
                      <div className="flex items-center justify-center py-8 text-slate-400 text-xs">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {t('admin.loading_history')}
                      </div>
                    ) : !userDetailData?.automations?.length ? (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium">
                        {t('admin.no_records')}
                      </div>
                    ) : (
                      userDetailData.automations.map((auto) => (
                        <div
                          key={auto.id}
                          onClick={() => {
                            setShowDetailModal(false);
                            navigate(`${ROUTES.ADMIN_AUTOMATIONS}?search=${encodeURIComponent(auto.name)}`);
                          }}
                          className="bg-white border border-slate-200 rounded-xl p-2.5 hover:border-indigo-400 hover:shadow-xs cursor-pointer transition group flex flex-col justify-between"
                          title="Перейти до цієї автоматизації на сторінці Автоматизацій"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center space-x-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  auto.active ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-slate-300'
                                }`}
                              />
                              <span className="font-bold text-slate-800 text-xs truncate group-hover:text-indigo-600 transition">
                                {auto.name}
                              </span>
                            </div>
                            <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0 mt-0.5" />
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] font-mono">
                            {auto.botName && auto.botName !== '—' ? (
                              <span className="flex items-center gap-1 text-slate-700 font-semibold truncate max-w-[120px]">
                                <Bot size={11} className="text-indigo-600 shrink-0" />
                                <span className="truncate">{auto.botName}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-bold">—</span>
                            )}
                            <span className="font-bold text-slate-600">RUNS: {auto.triggerCount}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="md:col-span-7 border border-slate-200 rounded-xl bg-slate-50/50 p-3 flex flex-col min-h-0">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs font-bold text-slate-700 shrink-0">
                    <span>{t('admin.activity_history')}</span>
                    {userDetailData?.activities && (
                      <span className="text-[11px] font-mono text-slate-500 font-normal">
                        {t('admin.total_records')} {userDetailData.activities.totalElements}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                    {isDetailLoading ? (
                      <div className="flex items-center justify-center py-8 text-slate-400 text-xs">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {t('admin.loading_history')}
                      </div>
                    ) : userDetailData?.activities?.content && userDetailData.activities.content.length > 0 ? (
                      <div className="space-y-1.5">
                        {userDetailData.activities.content.map((act) => (
                          <div key={act.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-start justify-between text-xs hover:border-slate-300 transition">
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-bold text-slate-900 flex items-center space-x-2 truncate">
                                <span className="truncate">{translateAuditTitle(act.title)}</span>
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[9px] uppercase font-bold shrink-0">
                                  {act.badge}
                                </span>
                              </div>
                              <div className="text-slate-600 text-[11px] line-clamp-2">{translateAuditDescription(act.description)}</div>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono shrink-0 ml-2">
                              {formatEuroDateTime(act.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs font-medium">
                        {t('admin.no_records')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
                    disabled={activityPage === 0 || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev_page')}</span>
                  </button>

                  <span className="text-xs text-slate-600 font-mono font-bold px-1">
                    {t('admin.page_x_of_y', { current: activityPage + 1, total: userDetailData?.activities?.totalPages || 1 })}
                  </span>

                  <button
                    onClick={() => setActivityPage((prev) => prev + 1)}
                    disabled={!userDetailData?.activities || activityPage + 1 >= userDetailData.activities.totalPages || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>{t('admin.next_page')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 cursor-pointer transition"
                >
                  {t('admin.close')}
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
