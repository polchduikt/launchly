import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchAdminUsersApi, updateUserRoleApi, toggleUserStatusApi, fetchAdminUserDetailsApi } from '../../../api/admin';
import type { AdminUser } from '../../../api/admin';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
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
  MessageSquare
} from 'lucide-react';
import { useTranslation } from '../../../i18n/config';

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [sortFilter, setSortFilter] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(0);

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isBulkActionOpen, setIsBulkActionOpen] = useState(false);
  const bulkActionDropdownRef = useRef<HTMLDivElement>(null);

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const planDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target as Node)) {
        setIsPlanDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (bulkActionDropdownRef.current && !bulkActionDropdownRef.current.contains(event.target as Node)) {
        setIsBulkActionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', search, roleFilter, planFilter, sortFilter, page],
    queryFn: () => fetchAdminUsersApi(search, roleFilter, planFilter, sortFilter, page, 30),
  });

  const allUserIdsOnPage = data?.content?.map((u: AdminUser) => u.id) || [];
  const isAllSelected = allUserIdsOnPage.length > 0 && allUserIdsOnPage.every((id: number) => selectedUserIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allUserIdsOnPage);
    }
  };

  const handleToggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkChangeRole = () => {
    setIsBulkActionOpen(false);
    if (selectedUserIds.length === 0) return;
    const firstUser = data?.content?.find((u: AdminUser) => selectedUserIds.includes(u.id));
    if (firstUser) {
      setSelectedUser(firstUser);
      setNewRole(firstUser.role);
      setShowRoleModal(true);
    }
  };

  const handleBulkBlock = () => {
    setIsBulkActionOpen(false);
    if (selectedUserIds.length === 0) return;
    const activeSelectedUsers = data?.content?.filter((u: AdminUser) => selectedUserIds.includes(u.id) && u.active) || [];
    if (activeSelectedUsers.length === 0) return;

    setUserToBlock(activeSelectedUsers[0]);
    setBlockReasonOption('SUSPICIOUS_ACTIVITY');
    setCustomBlockReason('');
    setShowBlockModal(true);
  };

  const handleBulkUnblock = () => {
    setIsBulkActionOpen(false);
    if (selectedUserIds.length === 0) return;
    const blockedSelectedUsers = data?.content?.filter((u: AdminUser) => selectedUserIds.includes(u.id) && !u.active) || [];
    blockedSelectedUsers.forEach((u: AdminUser) => {
      statusMutation.mutate({ userId: u.id });
    });
    setSelectedUserIds([]);
  };

  useEffect(() => {
    const param = searchParams.get('search');
    if (param !== null) {
      setSearch(param);
      setPage(0);
    }
  }, [searchParams]);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER'>('ROLE_OWNER');

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState<AdminUser | null>(null);
  const [blockReasonOption, setBlockReasonOption] = useState<string>('SUSPICIOUS_ACTIVITY');
  const [customBlockReason, setCustomBlockReason] = useState<string>('');

  const [selectedDetailUser, setSelectedDetailUser] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'automations' | 'broadcasts' | 'system'>('all');
  const [activityPage, setActivityPage] = useState(0);

  const { data: userDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: ['adminUserDetails', selectedDetailUser?.id, detailPeriod, activityCategoryFilter, activityPage],
    queryFn: () => fetchAdminUserDetailsApi(selectedDetailUser!.id, detailPeriod, activityCategoryFilter, activityPage, 20),
    enabled: !!selectedDetailUser && showDetailModal
  });

  const handleOpenDetailModal = (user: AdminUser) => {
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

  const translateAuditTitle = (title: string, targetName?: string) => {
    if (!title) return targetName || '';
    let name = (targetName || '').trim();
    if (name === '{0}' || name === '{botName}' || name === 'null' || name === 'undefined') {
      name = '';
    }

    if (title.includes(':')) {
      const extracted = title.split(':')[1]?.trim() || '';
      if (extracted && extracted !== '{0}' && extracted !== '{botName}' && extracted !== 'null' && extracted !== 'undefined') {
        name = extracted;
      }
    }

    const cleanedTitle = title.replace(/:\s*\{0\}/g, '').replace(/\s*\{0\}/g, '').replace(/\{0\}/g, '').trim();

    if (cleanedTitle.startsWith('Реєстрація у Launchly') || cleanedTitle.startsWith('Registered in Launchly')) {
      return t('audit.user_registration.title');
    }
    if (cleanedTitle.startsWith('Авторизація користувача') || cleanedTitle.startsWith('User Authentication')) {
      return t('audit.user_auth.title');
    }
    if (cleanedTitle.startsWith('Підключення бота') || cleanedTitle.startsWith('Bot Connected')) {
      return name ? t('audit.bot_connected.title', { botName: name }) : t('audit.bot_created.title');
    }
    if (cleanedTitle.startsWith('Модифікація автоматизації') || cleanedTitle.startsWith('Automation Modified')) {
      return name ? t('audit.automation_modified.title', { botName: name }) : (t('audit.automation_modified.title_simple') || 'Модифікація автоматизації');
    }
    if (cleanedTitle.startsWith('Запуск розсилки') || cleanedTitle.startsWith('Broadcast Launched')) {
      return name ? `${t('audit.broadcast_launched.title')}: ${name}` : t('audit.broadcast_launched.title');
    }
    if (cleanedTitle.startsWith('Скасування розсилки') || cleanedTitle.startsWith('Broadcast Cancelled')) {
      return name ? `${t('audit.broadcast_cancelled.title')}: ${name}` : t('audit.broadcast_cancelled.title');
    }
    if (cleanedTitle.startsWith('Права доступу та роль') || cleanedTitle.startsWith('Access Rights & Role')) {
      return t('audit.access_role.title');
    }
    if (cleanedTitle.startsWith('Адміністративне блокування') || cleanedTitle.startsWith('Administrative Block')) {
      return t('audit.admin_block.title');
    }
    if (cleanedTitle.startsWith('Адміністративне розблокування') || cleanedTitle.startsWith('Administrative Unblock')) {
      return t('audit.admin_unblock.title');
    }
    return cleanedTitle;
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

  const planOptions = [
    { value: '', label: t('admin.all_plans') !== 'admin.all_plans' ? t('admin.all_plans') : 'Всі тарифи' },
    { value: 'FREE', label: t('admin.plan_free') !== 'admin.plan_free' ? t('admin.plan_free') : 'Free' },
    { value: 'STARTER', label: t('admin.plan_starter') !== 'admin.plan_starter' ? t('admin.plan_starter') : 'Starter' },
    { value: 'PRO', label: t('admin.plan_pro') !== 'admin.plan_pro' ? t('admin.plan_pro') : 'Pro' },
    { value: 'BUSINESS', label: t('admin.plan_business') !== 'admin.plan_business' ? t('admin.plan_business') : 'Business' },
  ];

  const getPlanLabel = (plan: string) => {
    const found = planOptions.find((p) => p.value === plan);
    return found ? found.label : (t('admin.all_plans') !== 'admin.all_plans' ? t('admin.all_plans') : 'Всі тарифи');
  };

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

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleOpenBlockModal = (user: AdminUser) => {
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
    if (selectedUserIds.length > 1) {
      const activeSelectedUsers = data?.content?.filter((u: AdminUser) => selectedUserIds.includes(u.id) && u.active) || [];
      activeSelectedUsers.forEach((u: AdminUser) => {
        statusMutation.mutate({
          userId: u.id,
          blockData: {
            reason: blockReasonOption,
            details: customBlockReason
          }
        });
      });
      setSelectedUserIds([]);
    } else if (userToBlock) {
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
    if (selectedUserIds.length > 1) {
      selectedUserIds.forEach((id) => {
        roleMutation.mutate({ userId: id, role: newRole });
      });
      setSelectedUserIds([]);
    } else if (selectedUser) {
      roleMutation.mutate({ userId: selectedUser.id, role: newRole });
    }
  };

  return (
    <AdminLayout noPadding={true}>
      <div className="flex h-full w-full overflow-hidden font-['JetBrains_Mono',monospace]">
        
        <aside className="w-56 lg:w-60 bg-[#F2EBDD] border-r-4 border-[#0A0A0A] h-full p-4 space-y-5 overflow-y-auto shrink-0 flex flex-col justify-between z-10 text-[#0A0A0A]">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-2 border-[#0A0A0A]">
              <h3 className="font-['Anybody',sans-serif] font-black text-[11px] uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5">
                <Filter size={14} className="text-[#0A0A0A]" />
                <span>{t('admin.filters_title')}</span>
              </h3>
              {(roleFilter || planFilter || sortFilter !== 'desc') && (
                <button
                  onClick={() => {
                    setRoleFilter('');
                    setPlanFilter('');
                    setSortFilter('desc');
                    setPage(0);
                  }}
                  className="text-[10px] font-black uppercase text-[#0A0A0A] hover:underline transition cursor-pointer"
                >
                  {t('admin.reset_filters')}
                </button>
              )}
            </div>

            <div className="space-y-1" ref={roleDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">{t('admin.user_role_label')}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <span>{getRoleLabel(roleFilter)}</span>
                  <ChevronDown size={14} className={`text-current transition-transform duration-200 ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 font-['JetBrains_Mono',monospace] overflow-hidden">
                    {roleOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setRoleFilter(opt.value);
                          setPage(0);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-bold uppercase flex items-center justify-between transition-colors cursor-pointer ${
                          roleFilter === opt.value
                            ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                            : 'text-[#0A0A0A] hover:bg-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1" ref={planDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">{t('admin.plan_filter_label') !== 'admin.plan_filter_label' ? t('admin.plan_filter_label') : 'Тарифний план'}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <span>{getPlanLabel(planFilter)}</span>
                  <ChevronDown size={14} className={`text-current transition-transform duration-200 ${isPlanDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isPlanDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 font-['JetBrains_Mono',monospace] overflow-hidden">
                    {planOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setPlanFilter(opt.value);
                          setPage(0);
                          setIsPlanDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-bold uppercase flex items-center justify-between transition-colors cursor-pointer ${
                          planFilter === opt.value
                            ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                            : 'text-[#0A0A0A] hover:bg-white'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1" ref={sortDropdownRef}>
              <label className="text-[10px] font-black uppercase tracking-wider text-[#0A0A0A] block">{t('admin.sorting_label')}</label>
              <div className="relative w-full">
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <span>{sortFilter === 'asc' ? t('admin.sort_oldest') : t('admin.sort_newest')}</span>
                  <ChevronDown size={14} className={`text-current transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1 font-['JetBrains_Mono',monospace] overflow-hidden">
                    {[
                      { value: 'desc', label: t('admin.sort_newest') },
                      { value: 'asc', label: t('admin.sort_oldest') },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortFilter(opt.value as 'desc' | 'asc');
                          setPage(0);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs font-bold uppercase flex items-center justify-between hover:bg-white transition cursor-pointer ${
                          sortFilter === opt.value ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A]'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0 h-full bg-[#F2EBDD] space-y-4 text-[#0A0A0A]">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]" size={15} />
                <input
                  type="text"
                  placeholder={t('admin.search_users_placeholder') !== 'admin.search_users_placeholder' ? t('admin.search_users_placeholder') : 'Search email, name...'}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] placeholder-slate-400 focus:outline-none shadow-[2px_2px_0px_#0A0A0A]"
                />
              </div>
              {isAdmin && selectedUserIds.length > 0 && (
                <span className="px-3.5 py-1.5 rounded-full bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-xs shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                  {t('admin.selected_count', { count: selectedUserIds.length })}
                </span>
              )}
            </div>

            {isAdmin && (
              <div className="relative" ref={bulkActionDropdownRef}>
                <button
                  type="button"
                  disabled={selectedUserIds.length === 0}
                  onClick={() => setIsBulkActionOpen(!isBulkActionOpen)}
                  className="flex items-center space-x-2.5 px-5 py-2 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                >
                  <span>{t('admin.bulk_actions')}</span>
                  <ChevronDown size={14} className={`text-current transition-transform duration-200 ${isBulkActionOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBulkActionOpen && selectedUserIds.length > 0 && (
                  <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0px_#0A0A0A] z-50 py-1.5 overflow-hidden font-['JetBrains_Mono',monospace]">
                    <button
                      type="button"
                      onClick={handleBulkChangeRole}
                      className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-[#0A0A0A] hover:bg-white flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <Shield size={14} className="text-[#0A0A0A]" />
                      <span>{t('admin.bulk_change_role')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkBlock}
                      className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-rose-700 hover:bg-white flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <UserX size={14} className="text-rose-700" />
                      <span>{t('admin.bulk_block')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkUnblock}
                      className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-emerald-700 hover:bg-white flex items-center space-x-2.5 transition cursor-pointer"
                    >
                      <UserCheck size={14} className="text-emerald-700" />
                      <span>{t('admin.bulk_unblock')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl overflow-hidden shadow-[4px_4px_0px_#0A0A0A]">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#0A0A0A]" size={32} />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-['JetBrains_Mono',monospace]">
                    <thead className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] text-[#0A0A0A] font-black uppercase text-[10px]">
                      <tr>
                        {isAdmin && (
                          <th className="py-4 px-4 text-center w-12">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleToggleSelectAll}
                              className="w-4 h-4 rounded border-2 border-[#0A0A0A] text-[#0A0A0A] accent-[#0A0A0A] cursor-pointer"
                            />
                          </th>
                        )}
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#0A0A0A]/20">
                      {data?.content?.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        return (
                          <tr key={u.id} className={`hover:bg-white transition ${isSelected ? 'bg-amber-100/60' : ''}`}>
                            {isAdmin && (
                              <td className="py-3.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectUser(u.id)}
                                  className="w-4 h-4 rounded border-2 border-[#0A0A0A] text-[#0A0A0A] accent-[#0A0A0A] cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="py-3.5 px-4">
                              <div
                                onClick={() => handleOpenDetailModal(u)}
                                className="flex items-center space-x-3 cursor-pointer group"
                                title="Переглянути деталі та статистику користувача"
                              >
                                {u.avatar ? (
                                  <img src={u.avatar} alt={u.name} referrerPolicy="no-referrer" className="w-9 h-9 rounded-full object-cover border-2 border-[#0A0A0A] shrink-0" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-white border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-xs shrink-0">
                                    {u.name ? u.name[0].toUpperCase() : 'U'}
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-black text-[#0A0A0A] text-xs underline-offset-2 group-hover:underline truncate">{u.name}</span>
                                  <span className="text-slate-700 text-[11px] font-bold truncate">{u.email}</span>
                                  {u.telegramUsername && (
                                    <span className="text-[#0A0A0A] text-[10px] font-mono truncate">@{u.telegramUsername}</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {u.role === 'ROLE_ADMIN' && (
                                <span className="px-2.5 py-1 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                                  Super Admin
                                </span>
                              )}
                              {u.role === 'ROLE_MANAGER' && (
                                <span className="px-2.5 py-1 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                                  Manager
                                </span>
                              )}
                              {u.role === 'ROLE_OWNER' && (
                                <span className="px-2.5 py-1 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                                  Owner
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-[#0A0A0A] uppercase font-mono text-[10px] font-black">
                              {(() => {
                                const main = u.provider || 'LOCAL';
                                if (main === 'TELEGRAM') return 'TELEGRAM';
                                return u.telegramUsername ? `${main}, TELEGRAM` : main;
                              })()}
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5 text-[#0A0A0A] font-mono font-black">
                                <Bot size={13} className="text-[#0A0A0A]" />
                                <span>{u.botsCount || 0}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5 text-[#0A0A0A] font-mono font-black">
                                <Workflow size={13} className="text-[#0A0A0A]" />
                                <span>{u.automationsCount || 0}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5 text-[#0A0A0A] font-mono font-black">
                                <Send size={13} className="text-[#0A0A0A]" />
                                <span>{u.broadcastsCount || 0}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5 text-[#0A0A0A] font-mono font-black">
                                <Users size={13} className="text-[#0A0A0A]" />
                                <span>{u.contactsCount || 0}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5 text-[#0A0A0A] font-mono font-black">
                                <MessageSquare size={13} className="text-[#0A0A0A]" />
                                <span>{u.messagesCount || 0}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px]">
                                {u.planName || 'FREE'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 text-center">
                              {u.active ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-200 text-emerald-950 border-2 border-[#0A0A0A]">
                                  {t('admin.active')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-rose-200 text-rose-950 border-2 border-[#0A0A0A]">
                                  {t('admin.blocked')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] text-xs text-[#0A0A0A] font-bold">
                  <div>
                    {t('admin.showing') !== 'admin.showing' ? t('admin.showing') : 'Показано'} <span className="font-black text-[#0A0A0A]">{data?.content?.length || 0}</span> {t('admin.of') !== 'admin.of' ? t('admin.of') : 'з'} <span className="font-black text-[#0A0A0A]">{data?.totalElements || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                      disabled={page === 0}
                      className="flex items-center space-x-1 px-3 py-1 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                      <span>{t('admin.prev') !== 'admin.prev' ? t('admin.prev') : 'Назад'}</span>
                    </button>

                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-white border-2 border-[#0A0A0A] text-xs font-black font-mono text-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A]">
                      <span>{page + 1}</span>
                      <span>/</span>
                      <span>{data?.totalPages || 1}</span>
                    </div>

                    <button
                      onClick={() => setPage((prev) => Math.min(prev + 1, (data?.totalPages || 1) - 1))}
                      disabled={!data || page >= data.totalPages - 1}
                      className="flex items-center space-x-1 px-3 py-1 rounded-xl border-2 border-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black disabled:opacity-40 disabled:cursor-not-allowed transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
                    >
                      <span>{t('admin.next') !== 'admin.next' ? t('admin.next') : 'Далі'}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {showRoleModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-md p-6 space-y-6 shadow-[10px_10px_0px_#0A0A0A] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
              <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                  <Shield size={20} className="text-[#0A0A0A]" />
                  <span>{t('admin.change_role_title')}</span>
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-[#0A0A0A] font-bold">
                  User: <strong className="font-black text-[#0A0A0A]">{selectedUser.email}</strong>
                </p>

                <div className="space-y-2.5">
                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                    newRole === 'ROLE_OWNER' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'bg-white text-[#0A0A0A]'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="role"
                        value="ROLE_OWNER"
                        checked={newRole === 'ROLE_OWNER'}
                        onChange={() => setNewRole('ROLE_OWNER')}
                        className="accent-[#0A0A0A]"
                      />
                      <span className="text-xs uppercase font-bold">{t('admin.owners')}</span>
                    </div>
                  </label>

                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                    newRole === 'ROLE_MANAGER' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'bg-white text-[#0A0A0A]'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="role"
                        value="ROLE_MANAGER"
                        checked={newRole === 'ROLE_MANAGER'}
                        onChange={() => setNewRole('ROLE_MANAGER')}
                        className="accent-[#0A0A0A]"
                      />
                      <span className="text-xs uppercase font-bold">{t('admin.managers')}</span>
                    </div>
                  </label>

                  <label className={`flex items-center justify-between p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                    newRole === 'ROLE_ADMIN' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'bg-white text-[#0A0A0A]'
                  }`}>
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="radio"
                        name="role"
                        value="ROLE_ADMIN"
                        checked={newRole === 'ROLE_ADMIN'}
                        onChange={() => setNewRole('ROLE_ADMIN')}
                        className="accent-[#0A0A0A]"
                      />
                      <span className="text-xs uppercase font-bold">{t('admin.admins')}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-[#0A0A0A]">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#0A0A0A] border-2 border-transparent hover:border-[#0A0A0A] bg-white cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={roleMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] shadow-[2px_2px_0px_#0A0A0A] transition flex items-center gap-1.5 cursor-pointer"
                >
                  {roleMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{t('admin.save_role')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showBlockModal && userToBlock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-[10px_10px_0px_#0A0A0A] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
              <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3">
                <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] flex items-center gap-2">
                  <ShieldAlert size={20} className="text-rose-600" />
                  <span>{t('admin.block_user_title')}</span>
                </h3>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] text-xs text-[#0A0A0A] space-y-1">
                  <div>User: <strong className="text-[#0A0A0A] font-black">{userToBlock.name}</strong></div>
                  <div className="text-slate-700 font-bold">{userToBlock.email}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-[#0A0A0A] block">{t('admin.select_block_reason')}</label>
                  {[
                    { code: 'SUSPICIOUS_ACTIVITY', key: 'admin.reason_suspicious' },
                    { code: 'VIOLATION_OF_RULES', key: 'admin.reason_rules' },
                    { code: 'SPAM', key: 'admin.reason_spam' },
                    { code: 'OTHER', key: 'admin.reason_other' }
                  ].map((r) => (
                    <label
                      key={r.code}
                      onClick={() => setBlockReasonOption(r.code)}
                      className={`flex items-center space-x-3 p-3.5 rounded-2xl border-2 border-[#0A0A0A] cursor-pointer transition ${
                        blockReasonOption === r.code
                          ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black shadow-[2px_2px_0px_#0A0A0A]'
                          : 'bg-white text-[#0A0A0A] hover:bg-amber-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="blockReason"
                        checked={blockReasonOption === r.code}
                        onChange={() => setBlockReasonOption(r.code)}
                        className="accent-[#0A0A0A]"
                      />
                      <span className="text-xs uppercase font-bold">{t(r.key)}</span>
                    </label>
                  ))}
                </div>

                {blockReasonOption === 'OTHER' && (
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-black uppercase text-[#0A0A0A] block">{t('admin.specify_block_reason')}</label>
                    <textarea
                      value={customBlockReason}
                      onChange={(e) => setCustomBlockReason(e.target.value)}
                      placeholder="..."
                      rows={3}
                      className="w-full p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl text-xs font-bold text-[#0A0A0A] focus:outline-none transition shadow-[2px_2px_0px_#0A0A0A]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t-2 border-[#0A0A0A]">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#0A0A0A] hover:bg-white border-2 border-transparent hover:border-[#0A0A0A] transition cursor-pointer"
                >
                  {t('admin.cancel')}
                </button>
                <button
                  onClick={handleConfirmBlock}
                  disabled={statusMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase text-white bg-rose-700 border-2 border-[#0A0A0A] hover:bg-rose-800 shadow-[2px_2px_0px_#0A0A0A] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {statusMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                  <span>{t('admin.confirm_block')}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedDetailUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-[#F2EBDD] border-4 border-[#0A0A0A] rounded-3xl w-full max-w-6xl h-[780px] max-h-[92vh] p-6 sm:p-7 shadow-[10px_10px_0px_#0A0A0A] flex flex-col justify-between space-y-4 overflow-hidden text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
              <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3.5 shrink-0">
                <div className="flex items-center space-x-3.5">
                  {selectedDetailUser.avatar ? (
                    <img
                      src={selectedDetailUser.avatar}
                      alt={selectedDetailUser.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#0A0A0A]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-lg">
                      {selectedDetailUser.name ? selectedDetailUser.name[0].toUpperCase() : 'U'}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-['Anybody',sans-serif] text-base font-black uppercase text-[#0A0A0A] leading-tight">{selectedDetailUser.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-[#0A0A0A] text-[#0A0A0A] font-black text-[10px] uppercase">
                        {selectedDetailUser.role}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border-2 border-[#0A0A0A] ${
                        selectedDetailUser.active
                          ? 'bg-emerald-200 text-emerald-950'
                          : 'bg-rose-200 text-rose-950'
                      }`}>
                        {selectedDetailUser.active ? t('admin.active') : t('admin.blocked')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-mono flex items-center space-x-2 font-bold">
                      <span>{selectedDetailUser.email}</span>
                      {selectedDetailUser.telegramUsername && (
                        <span className="text-[#0A0A0A]">@{selectedDetailUser.telegramUsername}</span>
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
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] font-black uppercase text-xs border-2 border-[#0A0A0A] transition cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
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
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black uppercase transition cursor-pointer border-2 border-[#0A0A0A] shadow-[2px_2px_0px_#0A0A0A] ${
                        selectedDetailUser.active
                          ? 'bg-rose-200 text-rose-950 hover:bg-rose-300'
                          : 'bg-emerald-200 text-emerald-950 hover:bg-emerald-300'
                      }`}
                    >
                      {selectedDetailUser.active ? t('admin.block') : t('admin.unblock')}
                    </button>
                  )}

                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm ml-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border-2 border-[#0A0A0A] shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-black text-[#0A0A0A] uppercase mr-1 flex items-center gap-1">
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                        detailPeriod === p.id
                          ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                          : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-[11px] font-black text-[#0A0A0A] uppercase mr-1 flex items-center gap-1">
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                        activityCategoryFilter === c.id
                          ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                          : 'text-[#0A0A0A] hover:bg-[#F2EBDD]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2 shrink-0">
                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.active_bots')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.botsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_automations')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.automationsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.cat_broadcasts')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.broadcastsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscribers')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.contactsCount ?? 0)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.messages_sent')}</div>
                  <div className="text-base font-black text-[#0A0A0A] mt-0.5">
                    {isDetailLoading ? '...' : (userDetailData?.messagesCount ?? 0)}
                  </div>
                </div>

                <div className="bg-white border-2 border-[#0A0A0A] rounded-xl p-2.5 shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="text-[10px] font-black uppercase text-slate-700">{t('admin.subscription_plan')}</div>
                  <div className="text-xs font-black text-[#0A0A0A] mt-1 truncate">
                    {isDetailLoading ? '...' : (userDetailData?.planName || 'FREE')}
                  </div>
                </div>
              </div>

              {!selectedDetailUser.active && selectedDetailUser.blockReason && (
                <div className="bg-rose-100 border-2 border-[#0A0A0A] rounded-xl p-2.5 text-xs text-rose-950 font-bold shrink-0 shadow-[2px_2px_0px_#0A0A0A]">
                  <span className="font-black">{t('blocked.reason_title')}</span> {selectedDetailUser.blockReason}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 overflow-hidden">
                <div className="lg:col-span-5 flex flex-col space-y-3 min-h-0 h-full overflow-hidden">
                  
                  <div className="flex-1 flex flex-col min-h-0 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3 overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                      <span>{t('admin.automations')}</span>
                      {userDetailData?.automations && (
                        <span className="text-[11px] font-mono text-[#0A0A0A] font-bold">
                          {t('admin.total')}: {userDetailData.automations.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                      {isDetailLoading ? (
                        <div className="flex items-center justify-center py-6 text-slate-700 text-xs font-bold">
                          <Loader2 size={16} className="animate-spin mr-2" />
                          {t('admin.loading_history')}
                        </div>
                      ) : !userDetailData?.automations?.length ? (
                        <div className="text-center py-6 text-slate-700 text-xs font-bold">
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
                            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-2.5 hover:bg-white cursor-pointer transition group flex flex-col justify-between"
                            title="Перейти до цієї автоматизації"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <span
                                  className={`w-2 h-2 rounded-full border border-[#0A0A0A] shrink-0 ${
                                    auto.active ? 'bg-emerald-400' : 'bg-slate-300'
                                  }`}
                                />
                                <span className="font-black text-[#0A0A0A] text-xs truncate group-hover:underline">
                                  {auto.name}
                                </span>
                              </div>
                              <ChevronRight size={14} className="text-[#0A0A0A] shrink-0 mt-0.5" />
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#0A0A0A]/20 text-[10px] font-mono">
                              {auto.botName && auto.botName !== '—' ? (
                                <span className="flex items-center gap-1 text-[#0A0A0A] font-bold truncate max-w-[120px]">
                                  <span className="truncate">{auto.botName}</span>
                                </span>
                              ) : (
                                <span className="text-slate-500 font-bold">—</span>
                              )}
                              <span className="font-black text-[#0A0A0A]">RUNS: {auto.triggerCount}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3 overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                    <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                      <span>{t('admin.cat_broadcasts')}</span>
                      {userDetailData?.broadcasts && (
                        <span className="text-[11px] font-mono text-[#0A0A0A] font-bold">
                          {t('admin.total')}: {userDetailData.broadcasts.length}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                      {isDetailLoading ? (
                        <div className="flex items-center justify-center py-6 text-slate-700 text-xs font-bold">
                          <Loader2 size={16} className="animate-spin mr-2" />
                          {t('admin.loading_history')}
                        </div>
                      ) : !userDetailData?.broadcasts?.length ? (
                        <div className="text-center py-6 text-slate-700 text-xs font-bold">
                          {t('admin.no_records')}
                        </div>
                      ) : (
                        userDetailData.broadcasts.map((bc) => (
                          <div
                            key={bc.id}
                            onClick={() => {
                              setShowDetailModal(false);
                              navigate(`${ROUTES.ADMIN_BROADCASTS}?search=${encodeURIComponent(bc.name)}`);
                            }}
                            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-2.5 hover:bg-white cursor-pointer transition group flex flex-col justify-between"
                            title="Перейти до цієї розсилки"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <span className="font-black text-[#0A0A0A] text-xs truncate group-hover:underline">
                                  {bc.name}
                                </span>
                              </div>
                              <ChevronRight size={14} className="text-[#0A0A0A] shrink-0 mt-0.5" />
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#0A0A0A]/20 text-[10px] font-mono">
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-[#0A0A0A] text-[#0A0A0A] font-black uppercase">
                                {bc.status}
                              </span>
                              <span className="font-black text-[#0A0A0A]">DELIVERED: {bc.sentCount}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                <div className="lg:col-span-7 border-2 border-[#0A0A0A] rounded-2xl bg-white p-3.5 flex flex-col min-h-0 h-full overflow-hidden shadow-[2px_2px_0px_#0A0A0A]">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-[#0A0A0A] text-xs font-black uppercase text-[#0A0A0A] shrink-0">
                    <span>{t('admin.activity_history')}</span>
                    {userDetailData?.activities && (
                      <span className="text-[11px] font-mono text-[#0A0A0A] font-bold">
                        {t('admin.total_records')} {userDetailData.activities.totalElements}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pt-2 pr-1">
                    {isDetailLoading ? (
                      <div className="flex items-center justify-center py-12 text-slate-700 text-xs font-bold">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {t('admin.loading_history')}
                      </div>
                    ) : userDetailData?.activities?.content && userDetailData.activities.content.length > 0 ? (
                      <div className="space-y-2">
                        {userDetailData.activities.content.map((act) => (
                          <div key={act.id} className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl p-3 flex items-start justify-between text-xs transition">
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="font-black text-[#0A0A0A] flex items-center space-x-2 truncate">
                                <span className="truncate">{translateAuditTitle(act.title, act.targetName)}</span>
                                <span className="px-1.5 py-0.2 rounded bg-white border border-[#0A0A0A] text-[#0A0A0A] font-mono text-[9px] uppercase font-black shrink-0">
                                  {act.badge}
                                </span>
                              </div>
                              <div className="text-slate-800 text-[11px] leading-relaxed font-bold">{translateAuditDescription(act.description)}</div>
                            </div>
                            <div className="text-[11px] text-slate-700 font-mono font-bold shrink-0">
                              {formatEuroDateTime(act.timestamp)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-700 text-xs font-bold">
                        {t('admin.no_records')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t-2 border-[#0A0A0A] shrink-0">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActivityPage((prev) => Math.max(0, prev - 1))}
                    disabled={activityPage === 0 || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>{t('admin.prev_page')}</span>
                  </button>

                  <span className="text-xs text-[#0A0A0A] font-mono font-black px-1">
                    {t('admin.page_x_of_y', { current: activityPage + 1, total: userDetailData?.activities?.totalPages || 1 })}
                  </span>

                  <button
                    onClick={() => setActivityPage((prev) => prev + 1)}
                    disabled={!userDetailData?.activities || activityPage + 1 >= userDetailData.activities.totalPages || isDetailLoading}
                    className="px-2.5 py-1 rounded-lg border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] text-xs font-black uppercase hover:bg-[#0A0A0A] hover:text-[#F2EBDD] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <span>{t('admin.next_page')}</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] border-2 border-[#0A0A0A] hover:bg-[#2A2A2A] cursor-pointer transition shadow-[2px_2px_0px_#0A0A0A]"
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
