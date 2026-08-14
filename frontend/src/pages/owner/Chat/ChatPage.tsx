import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBotStore } from '../../../store/useBotStore';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { useTranslation } from '../../../i18n/config';
import {
  useConversationQuery,
  useAllConversationsQuery,
  useMessagesQuery,
  useBotUsersQuery,
  useUpdateContactMetadataMutation,
  useUpdateConversationMutation,
  useSendNoteMutation,
} from '../../../hooks/crm/useCrmQueries';
import { useCrmWebSocket } from '../../../hooks/crm/useCrmWebSocket';
import { useChatLocalStorage } from '../../../hooks/crm/useChatLocalStorage';
import { useChatActions } from '../../../hooks/crm/useChatActions';
import { useChatFilters } from '../../../hooks/crm/useChatFilters';
import { AlertCircle, Plus } from 'lucide-react';
import { ChatHeader } from './components/ChatHeader';
import { SettingsModal } from '../../../components/common/SettingsModal';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatFilterBar } from './components/ChatFilterBar';
import { ConversationList } from './components/ConversationList';
import { MessageArea } from './components/MessageArea';
import { ReplyBar } from './components/ReplyBar';
import { ContactInfoPanel } from './components/ContactInfoPanel';
import { ScheduleMessageModal } from './components/ScheduleMessageModal';
import type { BottomTab } from '../../../types/chat';
import { useSearchParams } from 'react-router-dom';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { useQueryClient } from '@tanstack/react-query';
import { updateConversationApi } from '../../../api/crm';

export const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeBotId, setActiveBotId } = useBotStore();
  const { data: bots = [] } = useBotsQuery();

  const botId = activeBotId || (bots[0]?.id || 0);

  const [searchParams] = useSearchParams();
  const conversationIdParam = searchParams.get('conversationId');
  const parsedConvId = conversationIdParam ? parseInt(conversationIdParam, 10) : 0;

  const { data: targetConversation } = useConversationQuery(parsedConvId, !!parsedConvId);

  const { data: conversations = [], isLoading: isConvLoading } = useAllConversationsQuery();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConvId) ?? null;
  const currentBotId = selectedConversation?.botId || botId;

  useCrmWebSocket(currentBotId);
  const { data: botUsers = [] } = useBotUsersQuery(currentBotId);

  useEffect(() => {
    if (targetConversation && targetConversation.botId) {
      if (activeBotId !== targetConversation.botId) {
        setActiveBotId(targetConversation.botId);
      }
      setSelectedConvId(targetConversation.id);
    } else if (conversationIdParam) {
      const convId = parseInt(conversationIdParam, 10);
      if (!isNaN(convId)) {
        setSelectedConvId(convId);
      }
    }
  }, [targetConversation, conversationIdParam, activeBotId, setActiveBotId]);

  const { data: messages = [], isLoading: isMsgLoading } = useMessagesQuery(selectedConvId || 0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [bottomTab, setBottomTab] = useState<BottomTab>('reply');
  const [typedNote, setTypedNote] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const ls = useChatLocalStorage({ conversations, selectedConvId });
  const actions = useChatActions({ selectedConvId, botId: currentBotId });
  const filters = useChatFilters({
    conversations,
    favorites: ls.favorites,
    unreadConvIds: ls.unreadConvIds,
    botUsers,
  });

  const currentBotUser = botUsers.find(u => u.telegramId === selectedConversation?.botUserTelegramId);
  const updateMetaMut = useUpdateContactMetadataMutation(currentBotId);
  const updateConvMut = useUpdateConversationMutation(currentBotId);
  const sendNoteMut = useSendNoteMutation(selectedConvId || 0, currentBotId);
  const handleSaveNote = useCallback(() => {
    if (!typedNote.trim() || !selectedConvId) return;
    sendNoteMut.mutate(typedNote.trim(), {
      onSuccess: () => setTypedNote(''),
    });
  }, [typedNote, selectedConvId, sendNoteMut]);
  const queryClient = useQueryClient();
  const handleSelectConv = useCallback((id: number) => {
    setSelectedConvId(id);
    ls.markAsRead(id);
    const conv = conversations.find(c => c.id === id);
    if (conv?.unread) {
      updateConversationApi(id, { unread: false })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['conversations', 'all'] });
        })
        .catch(() => {});
    }
  }, [conversations, ls, queryClient]);

  useEffect(() => {
    if (selectedConvId) setTypedNote(ls.contactNotes[selectedConvId] || '');
  }, [selectedConvId]);
  const parsedMeta: Record<string, unknown> = (() => {
    try {
      return currentBotUser?.metadata ? JSON.parse(currentBotUser.metadata) : {};
    } catch {
      return {};
    }
  })();

  const isPaused = (() => {
    try {
      const p = parsedMeta as { paused?: boolean; pausedUntil?: number | null };
      if (!p.paused) return false;
      if (p.pausedUntil === null || p.pausedUntil === undefined) return true;
      return p.pausedUntil > Date.now();
    } catch {
      return false;
    }
  })();

  const handleUpdateMeta = useCallback((meta: Record<string, unknown>) => {
    if (!currentBotUser) return;
    updateMetaMut.mutate({ userId: currentBotUser.id, metadata: JSON.stringify(meta) });
  }, [currentBotUser, updateMetaMut]);

  const handleAddLabel = useCallback((label: string) => {
    const labels: string[] = Array.isArray(parsedMeta.labels) ? parsedMeta.labels as string[] : [];
    if (!labels.includes(label)) {
      handleUpdateMeta({ ...parsedMeta, labels: [...labels, label] });
    }
    ls.addLabelByName(label);
  }, [parsedMeta, handleUpdateMeta, ls]);

  const handleRemoveLabel = useCallback((label: string) => {
    const labels: string[] = Array.isArray(parsedMeta.labels) ? parsedMeta.labels as string[] : [];
    handleUpdateMeta({ ...parsedMeta, labels: labels.filter(l => l !== label) });
  }, [parsedMeta, handleUpdateMeta]);

  const handleSetReminder = useCallback((reminderTime: number | null) => {
    handleUpdateMeta({ ...parsedMeta, reminderTime });
  }, [parsedMeta, handleUpdateMeta]);

  const handlePause = useCallback((durationMs: number | null) => {
    const pausedUntil = durationMs ? Date.now() + durationMs : null;
    handleUpdateMeta({ ...parsedMeta, paused: true, pausedUntil });
  }, [parsedMeta, handleUpdateMeta]);

  const handleResume = useCallback(() => {
    handleUpdateMeta({ ...parsedMeta, paused: false, pausedUntil: null });
  }, [parsedMeta, handleUpdateMeta]);

  const handleCloseConversation = useCallback(() => {
    if (!selectedConvId) return;
    const newStatus = selectedConversation?.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    updateConvMut.mutate({ conversationId: selectedConvId, status: newStatus });
  }, [selectedConvId, selectedConversation, updateConvMut]);

  const handleMarkUnread = useCallback(() => {
    if (!selectedConvId) return;
    updateConvMut.mutate({ conversationId: selectedConvId, unread: true });
    setSelectedConvId(null);
  }, [selectedConvId, updateConvMut]);

  if (botId === 0) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center p-8 text-center bg-[#F2EBDD]">
          <div className="max-w-md space-y-4 font-['JetBrains_Mono',monospace] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-10 shadow-[4px_4px_0px_#0A0A0A]">
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] flex items-center justify-center mx-auto text-[#0A0A0A]">
              <AlertCircle size={32} />
            </div>
            <p className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] text-xl uppercase tracking-tight">
              {t('crm.contacts.no_bot_title', 'No active bot found')}
            </p>
            <p className="font-['Geist',sans-serif] text-xs text-[#0A0A0A]/70 font-semibold max-w-xs mx-auto leading-relaxed">
              {t('crm.contacts.no_bot_desc', 'Please connect a bot first to access the chat.')}
            </p>
            <div className="pt-2">
              <button
                onClick={() => navigate('/connect-bot')}
                className="px-6 py-3 bg-[#0A0A0A] text-[#F2EBDD] font-['JetBrains_Mono',monospace] text-xs font-black uppercase tracking-wider border-2 border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:bg-white hover:text-[#0A0A0A] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <Plus size={14} />
                <span>{t('connect_bot.btn_connect_existing', 'Connect Bot')}</span>
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col bg-[#F2EBDD] font-['JetBrains_Mono',monospace] overflow-hidden w-full max-w-full">
        <style>{`
          .scrollbar-none::-webkit-scrollbar { display: none; }
          .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <ChatHeader searchQuery={filters.searchQuery} onSearchChange={filters.setSearchQuery} onOpenSettings={() => setIsSettingsModalOpen(true)} />

        <div className="flex-1 flex overflow-hidden w-full">
          <ChatSidebar
            sidebarTab={filters.sidebarTab}
            onTabChange={filters.setSidebarTab}
            conversationsCount={conversations.length}
            labels={ls.labels}
            showAddLabel={ls.showAddLabel}
            onShowAddLabel={ls.setShowAddLabel}
            newLabelName={ls.newLabelName}
            onNewLabelNameChange={ls.setNewLabelName}
            onAddLabel={ls.addLabel}
            collapsed={sidebarCollapsed}
            onCollapse={setSidebarCollapsed}
          />

          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatFilterBar
              chatFilter={filters.chatFilter}
              onChatFilterChange={filters.setChatFilter}
              chatFilterLabel={filters.chatFilterLabel}
              showChatFilterDrop={filters.showChatFilterDrop}
              onShowChatFilterDrop={filters.setShowChatFilterDrop}
              filterRef={filters.filterRef}
              showUnreadOnly={filters.showUnreadOnly}
              onShowUnreadOnlyChange={filters.setShowUnreadOnly}
              unreadCount={ls.unreadConvIds.length}
              sortOrder={filters.sortOrder}
              onSortOrderChange={filters.setSortOrder}
              showSortDrop={filters.showSortDrop}
              onShowSortDrop={filters.setShowSortDrop}
              sortRef={filters.sortRef}
              onResetFilters={filters.resetFilters}
            />

            <div className="flex-1 flex overflow-hidden w-full">
              <ConversationList
                conversations={filters.filteredConversations}
                selectedConvId={selectedConvId}
                onSelect={handleSelectConv}
                isLoading={isConvLoading}
                favorites={ls.favorites}
                onToggleFavorite={ls.toggleFavorite}
                unreadConvIds={ls.unreadConvIds}
                searchQuery={filters.searchQuery}
                chatFilter={filters.chatFilter}
              />

              <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
                {selectedConversation ? (
                  <>
                    <MessageArea
                      conversation={selectedConversation}
                      botUser={currentBotUser}
                      messages={messages}
                      isMsgLoading={isMsgLoading}
                      onButtonClick={(label) => actions.setTypedMessage(label)}
                      infoPanelOpen={infoPanelOpen}
                      onToggleInfoPanel={() => setInfoPanelOpen(v => !v)}
                      onCloseConversation={handleCloseConversation}
                      onMarkUnread={handleMarkUnread}
                      onPause={handlePause}
                      onResume={handleResume}
                      onAddLabel={handleAddLabel}
                      onRemoveLabel={handleRemoveLabel}
                      onDeleteGlobalLabel={ls.deleteLabelByName}
                      onSetReminder={handleSetReminder}
                      allLabels={ls.labels}
                      isPaused={isPaused}
                      isFavorite={selectedConvId ? ls.favorites.includes(selectedConvId) : false}
                      onToggleFavorite={() => selectedConvId && ls.toggleFavorite(selectedConvId)}
                      meta={parsedMeta}
                    />
                    <ReplyBar
                      bottomTab={bottomTab}
                      onTabChange={setBottomTab}
                      typedMessage={actions.typedMessage}
                      onTypedMessageChange={actions.setTypedMessage}
                      onKeyPress={actions.handleKeyPress}
                      onSend={actions.handleSend}
                      isSending={actions.sendMessageMut.isPending}
                      pendingImage={actions.pendingImage}
                      onClearPendingImage={() => actions.setPendingImage(null)}
                      isRecording={actions.isRecording}
                      onMicClick={actions.handleMicClick}
                      showEmojiPicker={actions.showEmojiPicker}
                      onToggleEmojiPicker={() => actions.setShowEmojiPicker(!actions.showEmojiPicker)}
                      onEmojiSelect={actions.handleEmojiSelect}
                      emojiRef={actions.emojiRef}
                      imageInputRef={actions.imageInputRef}
                      fileInputRef={actions.fileInputRef}
                      onImageSelect={actions.handleImageSelect}
                      onFileSelect={actions.handleFileSelect}
                      isImageUploading={actions.mediaUpload.isPending}
                      isFileUploading={actions.fileUpload.isPending}
                      typedNote={typedNote}
                      onTypedNoteChange={setTypedNote}
                      onSaveNote={handleSaveNote}
                      onScheduleClick={() => setShowScheduleModal(true)}
                    />
                  </>
                ) : (
                  <MessageArea conversation={null} messages={[]} isMsgLoading={false} onButtonClick={() => {}} />
                )}
              </div>
            </div>
          </div>

          {selectedConversation && (
            <ContactInfoPanel
              botId={currentBotId}
              conversation={selectedConversation}
              botUser={currentBotUser}
              messages={messages}
              onScrollToNote={(noteId) => {
                const noteEl = document.querySelector(`[data-message-id="${noteId}"]`);
                if (noteEl) {
                  noteEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              isOpen={infoPanelOpen}
              onClose={() => setInfoPanelOpen(false)}
              onOpen={() => setInfoPanelOpen(true)}
            />
          )}
        </div>
      </div>

     <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} initialTab="notifications" />
     <ScheduleMessageModal
       isOpen={showScheduleModal}
       onClose={() => setShowScheduleModal(false)}
       initialText={actions.typedMessage}
       onSchedule={(dateTime) => {
         actions.handleScheduleSend(dateTime);
         setShowScheduleModal(false);
       }}
     />
    </DashboardLayout>
  );
};
