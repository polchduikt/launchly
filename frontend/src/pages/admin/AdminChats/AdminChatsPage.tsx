import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../../../hooks/useDebounce';
import { queryKeys } from '../../../api/queryKeys';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import {
  fetchAdminSupportTicketsApi,
  fetchAdminSupportTicketDetailApi,
  sendAdminSupportMessageApi,
  toggleAdminSupportTicketFavoriteApi,
  toggleAdminSupportTicketStatusApi,
  claimAdminSupportTicketApi,
  fetchAdminUserDetailsApi,
} from '../../../api/admin';
import { useAuthStore } from '../../../store/useAuthStore';
import { ROUTES } from '../../../routes/paths';
import {
  AdminTicketFilters,
  AdminTicketList,
  AdminChatThread,
  AdminUserProfileSidebar,
  AdminUserDetailModal,
} from './components';
import type {
  TicketTabType,
  TicketPeriodType,
  TicketSortType,
} from './components/AdminTicketFilters';

export const AdminChatsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (currentUser && currentUser.role === 'ROLE_ADMIN') {
      navigate(ROUTES.ADMIN_STATS, { replace: true });
    }
  }, [currentUser, navigate]);

  const [activeTab, setActiveTab] = useState<TicketTabType>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<TicketPeriodType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortOrder, setSortOrder] = useState<TicketSortType>('desc');
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [isProfileCollapsed, setIsProfileCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailPeriod, setDetailPeriod] = useState<'week' | 'month' | '3months' | 'all'>('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<'all' | 'automations' | 'broadcasts' | 'system'>('all');
  const [activityPage, setActivityPage] = useState(0);

  const { data: ticketsData, isLoading: isTicketsLoading } = useQuery({
    queryKey: [...queryKeys.admin.supportTickets, activeTab, selectedPeriod, debouncedSearchQuery],
    queryFn: () => fetchAdminSupportTicketsApi(activeTab, selectedPeriod, debouncedSearchQuery, 0, 50),
    refetchInterval: 5000,
  });

  const rawTickets = ticketsData?.content || [];

  const tickets = [...rawTickets]
    .filter((c) => {
      const status = c.status as string;
      if (activeTab === 'completed') {
        return status === 'CLOSED';
      }
      if (activeTab === 'resolved') {
        return status === 'RESOLVED';
      }
      return status !== 'RESOLVED' && status !== 'CLOSED';
    })
    .sort((a, b) => {
      const timeA = new Date(a.lastMessageTime || 0).getTime();
      const timeB = new Date(b.lastMessageTime || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0].id);
    }
  }, [tickets, selectedTicketId]);

  const { data: selectedTicket } = useQuery({
    queryKey: queryKeys.admin.supportTicketDetail(selectedTicketId),
    queryFn: () => fetchAdminSupportTicketDetailApi(selectedTicketId!),
    enabled: !!selectedTicketId,
    refetchInterval: 3000,
  });

  const { data: userDetailData, isLoading: isDetailLoading } = useQuery({
    queryKey: [...queryKeys.admin.userDetails(selectedTicket?.userId), detailPeriod, activityCategoryFilter, activityPage],
    queryFn: () => fetchAdminUserDetailsApi(selectedTicket!.userId, detailPeriod, activityCategoryFilter, activityPage, 20),
    enabled: !!selectedTicket?.userId && showDetailModal,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  const sendMessageMutation = useMutation({
    mutationFn: ({ id, text }: { id: number; text: string }) => sendAdminSupportMessageApi(id, text),
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTickets });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTicketDetail(selectedTicketId) });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => toggleAdminSupportTicketFavoriteApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTickets });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTicketDetail(selectedTicketId) });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status?: string }) => toggleAdminSupportTicketStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTickets });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTicketDetail(selectedTicketId) });
    },
  });

  const claimTicketMutation = useMutation({
    mutationFn: (id: number) => claimAdminSupportTicketApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTickets });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.supportTicketDetail(selectedTicketId) });
    },
  });

  const handleSelectTicket = (id: number) => {
    setSelectedTicketId(id);
  };

  const handleToggleFavorite = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteMutation.mutate(id);
  };

  const handleCompleteDialog = () => {
    if (selectedTicketId) {
      toggleStatusMutation.mutate({ id: selectedTicketId, status: 'CLOSED' });
    }
  };

  const handleResolveDialog = () => {
    if (selectedTicketId) {
      toggleStatusMutation.mutate({ id: selectedTicketId, status: 'RESOLVED' });
    }
  };

  const handleClaimTicket = () => {
    if (selectedTicketId) {
      claimTicketMutation.mutate(selectedTicketId);
    }
  };

  const handleResetFilters = () => {
    setActiveTab('all');
    setSelectedPeriod('all');
    setSearchQuery('');
    setSortOrder('desc');
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;
    sendMessageMutation.mutate({ id: selectedTicketId, text: replyText.trim() });
  };

  const handleOpenDetails = () => {
    setActivityPage(0);
    setShowDetailModal(true);
  };

  return (
    <AdminLayout noPadding={true}>
      <div className="flex h-full w-full overflow-hidden bg-[#F2EBDD] text-[#0A0A0A] font-['JetBrains_Mono',monospace]">
        <AdminTicketFilters
          isFilterCollapsed={isFilterCollapsed}
          setIsFilterCollapsed={setIsFilterCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onResetFilters={handleResetFilters}
        />

        <AdminTicketList
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          isTicketsLoading={isTicketsLoading}
          onSelectTicket={handleSelectTicket}
          onToggleFavorite={handleToggleFavorite}
        />

        <AdminChatThread
          selectedTicket={selectedTicket!}
          currentUserEmail={currentUser?.email}
          replyText={replyText}
          setReplyText={setReplyText}
          onSendMessage={handleSendMessage}
          isSending={sendMessageMutation.isPending}
          onClaimTicket={handleClaimTicket}
          isClaiming={claimTicketMutation.isPending}
          onCompleteDialog={handleCompleteDialog}
          onResolveDialog={handleResolveDialog}
          isStatusToggling={toggleStatusMutation.isPending}
          messagesEndRef={messagesEndRef}
        />

        <AdminUserProfileSidebar
          selectedTicket={selectedTicket}
          isProfileCollapsed={isProfileCollapsed}
          setIsProfileCollapsed={setIsProfileCollapsed}
          onOpenDetails={handleOpenDetails}
        />

        <AdminUserDetailModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          selectedTicket={selectedTicket}
          userDetailData={userDetailData}
          isDetailLoading={isDetailLoading}
          detailPeriod={detailPeriod}
          setDetailPeriod={setDetailPeriod}
          activityCategoryFilter={activityCategoryFilter}
          setActivityCategoryFilter={setActivityCategoryFilter}
          activityPage={activityPage}
          setActivityPage={setActivityPage}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminChatsPage;
