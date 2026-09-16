import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { fetchAdminUsersApi, updateUserRoleApi, toggleUserStatusApi } from '../../../api/admin';
import type { AdminUser } from '../../../api/admin';
import { queryKeys } from '../../../api/queryKeys';
import { PAGINATION } from '../../../const/constants';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import {
  AdminSearchBar,
  AdminPagination,
  AdminFilterDropdown,
  AdminBulkActions,
  AdminBlockModal,
} from '../../../components/admin';
import { useAdminSearch, useAdminSelection } from '../../../hooks/admin';
import { AdminUserRoleModal } from './components/AdminUserRoleModal';
import { AdminUserDetailModal } from './components/AdminUserDetailModal';
import {
  Bot,
  Filter,
  Shield,
  UserCheck,
  UserX,
  Workflow,
  Send,
  Users,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useTranslation } from '../../../i18n/config';

export const AdminUsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const {
    search,
    setSearch,
    debouncedSearch,
    page,
    setPage,
  } = useAdminSearch({ initialSearch });

  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [sortFilter, setSortFilter] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    const param = searchParams.get('search');
    if (param !== null) {
      setSearch(param);
    }
  }, [searchParams, setSearch]);

  const usersQueryKey = [...queryKeys.admin.users, debouncedSearch, roleFilter, planFilter, sortFilter, page] as const;

  const { data, isLoading } = useQuery({
    queryKey: usersQueryKey,
    queryFn: () => fetchAdminUsersApi(debouncedSearch, roleFilter, planFilter, sortFilter, page, PAGINATION.ADMIN_PAGE_SIZE),
  });

  const allUsersOnPage = data?.content || [];

  const {
    selectedIds: selectedUserIds,
    isAllSelected,
    toggleSelectAll: handleToggleSelectAll,
    toggleSelect: handleToggleSelectUser,
    clearSelection,
  } = useAdminSelection(allUsersOnPage);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState<AdminUser | null>(null);

  const [selectedDetailUser, setSelectedDetailUser] = useState<AdminUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const roleOptions = [
    { value: '', label: t('admin.all_roles') !== 'admin.all_roles' ? t('admin.all_roles') : 'Всі ролі' },
    { value: 'ROLE_OWNER', label: t('admin.owners') !== 'admin.owners' ? t('admin.owners') : 'Овнер' },
    { value: 'ROLE_MANAGER', label: t('admin.managers') !== 'admin.managers' ? t('admin.managers') : 'Менеджер' },
    { value: 'ROLE_ADMIN', label: t('admin.admins') !== 'admin.admins' ? t('admin.admins') : 'Адмін' },
  ];

  const planOptions = [
    { value: '', label: t('admin.all_plans') !== 'admin.all_plans' ? t('admin.all_plans') : 'Всі тарифи' },
    { value: 'FREE', label: t('admin.plan_free') !== 'admin.plan_free' ? t('admin.plan_free') : 'Free' },
    { value: 'STARTER', label: t('admin.plan_starter') !== 'admin.plan_starter' ? t('admin.plan_starter') : 'Starter' },
    { value: 'PRO', label: t('admin.plan_pro') !== 'admin.plan_pro' ? t('admin.plan_pro') : 'Pro' },
    { value: 'BUSINESS', label: t('admin.plan_business') !== 'admin.plan_business' ? t('admin.plan_business') : 'Business' },
  ];

  const sortOptions = [
    { value: 'desc', label: t('admin.sort_newest') },
    { value: 'asc', label: t('admin.sort_oldest') },
  ];

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: AdminUser['role'] }) => updateUserRoleApi(userId, role),
    onMutate: async ({ userId, role }: { userId: number; role: AdminUser['role'] }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users });
      const previousData = queryClient.getQueryData<{ content: AdminUser[]; totalElements: number; totalPages: number }>(usersQueryKey);
      queryClient.setQueryData<{ content: AdminUser[]; totalElements: number; totalPages: number }>(usersQueryKey, (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((u: AdminUser) =>
            u.id === userId ? { ...u, role } : u
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(usersQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      setShowRoleModal(false);
      setSelectedUser(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, blockData }: { userId: number; blockData?: { reason: string; details?: string } }) =>
      toggleUserStatusApi(userId, blockData),
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.users });
      const previousData = queryClient.getQueryData<{ content?: AdminUser[] }>(usersQueryKey);
      queryClient.setQueryData<{ content?: AdminUser[] }>(usersQueryKey, (old) => {
        if (!old?.content) return old;
        return {
          ...old,
          content: old.content.map((u: AdminUser) =>
            u.id === userId ? { ...u, active: !u.active } : u
          ),
        };
      });
      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(usersQueryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users });
      setShowBlockModal(false);
      setUserToBlock(null);
    },
  });

  const handleOpenDetailModal = (user: AdminUser) => {
    setSelectedDetailUser(user);
    setShowDetailModal(true);
  };

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleOpenBlockModal = (user: AdminUser) => {
    if (user.active) {
      setUserToBlock(user);
      setShowBlockModal(true);
    } else {
      statusMutation.mutate({ userId: user.id });
    }
  };

  const handleBulkChangeRole = () => {
    if (selectedUserIds.length === 0) return;
    const firstUser = data?.content?.find((u: AdminUser) => selectedUserIds.includes(u.id));
    if (firstUser) {
      setSelectedUser(firstUser);
      setShowRoleModal(true);
    }
  };

  const handleBulkBlock = () => {
    if (selectedUserIds.length === 0) return;
    const activeSelectedUsers = data?.content?.filter((u: AdminUser) => selectedUserIds.includes(u.id) && u.active) || [];
    if (activeSelectedUsers.length === 0) return;

    setUserToBlock(activeSelectedUsers[0]);
    setShowBlockModal(true);
  };

  const handleBulkUnblock = () => {
    if (selectedUserIds.length === 0) return;
    const blockedSelectedUsers = data?.content?.filter((u: AdminUser) => selectedUserIds.includes(u.id) && !u.active) || [];
    blockedSelectedUsers.forEach((u: AdminUser) => {
      statusMutation.mutate({ userId: u.id });
    });
    clearSelection();
  };

  const handleConfirmBlock = (reason: string, details?: string) => {
    if (selectedUserIds.length > 1) {
      const activeSelectedUsers = data?.content?.filter((u: AdminUser) => selectedUserIds.includes(u.id) && u.active) || [];
      activeSelectedUsers.forEach((u: AdminUser) => {
        statusMutation.mutate({
          userId: u.id,
          blockData: { reason, details },
        });
      });
      clearSelection();
    } else if (userToBlock) {
      statusMutation.mutate({
        userId: userToBlock.id,
        blockData: { reason, details },
      });
    }
  };

  const handleSaveRole = (role: 'ROLE_OWNER' | 'ROLE_ADMIN' | 'ROLE_MANAGER') => {
    if (selectedUserIds.length > 1) {
      selectedUserIds.forEach((id) => {
        roleMutation.mutate({ userId: Number(id), role });
      });
      clearSelection();
    } else if (selectedUser) {
      roleMutation.mutate({ userId: selectedUser.id, role });
    }
  };

  const handleResetFilters = () => {
    setRoleFilter('');
    setPlanFilter('');
    setSortFilter('desc');
    setPage(0);
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
            </div>

            <AdminFilterDropdown
              label={t('admin.role')}
              value={roleFilter}
              options={roleOptions}
              onChange={(val) => {
                setRoleFilter(val);
                setPage(0);
              }}
            />

            <AdminFilterDropdown
              label={t('admin.plan')}
              value={planFilter}
              options={planOptions}
              onChange={(val) => {
                setPlanFilter(val);
                setPage(0);
              }}
            />

            <AdminFilterDropdown
              label={t('admin.sort')}
              value={sortFilter}
              options={sortOptions}
              onChange={(val) => {
                setSortFilter(val as 'desc' | 'asc');
                setPage(0);
              }}
            />

            <button
              onClick={handleResetFilters}
              className="w-full mt-4 py-2 border-2 border-[#0A0A0A] rounded-xl text-xs font-black uppercase text-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] transition shadow-[2px_2px_0px_#0A0A0A] cursor-pointer"
            >
              {t('admin.reset_filters')}
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t-2 border-[#0A0A0A]/20">
            <AdminPagination
              page={page}
              totalPages={data?.totalPages || 1}
              totalElements={data?.totalElements || 0}
              currentCount={data?.content?.length || 0}
              onPageChange={setPage}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0 h-full bg-[#F2EBDD] space-y-4 text-[#0A0A0A]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <AdminSearchBar
              value={search}
              onChange={setSearch}
              placeholder={t('admin.search_users_placeholder') !== 'admin.search_users_placeholder' ? t('admin.search_users_placeholder') : 'Search email, name...'}
            />

            {isAdmin && (
              <AdminBulkActions
                selectedCount={selectedUserIds.length}
                actions={[
                  {
                    label: t('admin.bulk_change_role'),
                    icon: <Shield size={14} />,
                    onClick: handleBulkChangeRole,
                  },
                  {
                    label: t('admin.bulk_block'),
                    icon: <UserX size={14} />,
                    onClick: handleBulkBlock,
                    variant: 'danger',
                  },
                  {
                    label: t('admin.bulk_unblock'),
                    icon: <UserCheck size={14} />,
                    onClick: handleBulkUnblock,
                    variant: 'default',
                  },
                ]}
              />
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
                                  <img
                                    src={u.avatar}
                                    alt={u.name}
                                    referrerPolicy="no-referrer"
                                    className="w-9 h-9 rounded-full object-cover border-2 border-[#0A0A0A] shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-white border-2 border-[#0A0A0A] flex items-center justify-center font-black text-[#0A0A0A] text-xs shrink-0">
                                    {u.name ? u.name[0].toUpperCase() : 'U'}
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="font-black text-[#0A0A0A] text-xs underline-offset-2 group-hover:underline truncate">
                                    {u.name}
                                  </span>
                                  <span className="text-slate-700 text-[11px] font-bold truncate">
                                    {u.email}
                                  </span>
                                  {u.telegramUsername && (
                                    <span className="text-[#0A0A0A] text-[10px] font-mono truncate">
                                      @{u.telegramUsername}
                                    </span>
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

                <AdminPagination
                  page={page}
                  totalPages={data?.totalPages || 1}
                  totalElements={data?.totalElements || 0}
                  currentCount={data?.content?.length || 0}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </main>

        <AdminUserRoleModal
          isOpen={showRoleModal && !!selectedUser}
          user={selectedUser}
          onClose={() => {
            setShowRoleModal(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveRole}
          isPending={roleMutation.isPending}
        />

        <AdminBlockModal
          isOpen={showBlockModal && !!userToBlock}
          onClose={() => {
            setShowBlockModal(false);
            setUserToBlock(null);
          }}
          onConfirm={handleConfirmBlock}
          title={t('admin.block_user_title')}
          isPending={statusMutation.isPending}
          entityInfo={
            userToBlock ? (
              <div className="bg-white p-3.5 rounded-2xl border-2 border-[#0A0A0A] text-xs text-[#0A0A0A] space-y-1">
                <div>User: <strong className="text-[#0A0A0A] font-black">{userToBlock.name}</strong></div>
                <div className="text-slate-700 font-bold">{userToBlock.email}</div>
              </div>
            ) : null
          }
        />

        <AdminUserDetailModal
          isOpen={showDetailModal && !!selectedDetailUser}
          user={selectedDetailUser}
          isAdmin={isAdmin}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDetailUser(null);
          }}
          onOpenRoleModal={handleOpenRoleModal}
          onOpenBlockModal={handleOpenBlockModal}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;
