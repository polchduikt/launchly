import React, { useState, useEffect } from 'react';
import { useBotStore } from '../../../store/useBotStore';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { useConversationsQuery, useMessagesQuery } from '../hooks/useCrmQueries';
import { useCrmWebSocket } from '../hooks/useCrmWebSocket';
import { useChatLocalStorage } from '../hooks/useChatLocalStorage';
import { useChatActions } from '../hooks/useChatActions';
import { useChatFilters } from '../hooks/useChatFilters';
import { AlertCircle } from 'lucide-react';
import { ChatHeader } from '../components/ChatHeader';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatFilterBar } from '../components/ChatFilterBar';
import { ConversationList } from '../components/ConversationList';
import { MessageArea } from '../components/MessageArea';
import { ReplyBar } from '../components/ReplyBar';
import { ContactInfoPanel } from '../components/ContactInfoPanel';
import type { BottomTab } from '../types/chat';

export const ChatPage: React.FC = () => {
  const activeBotId = useBotStore((s) => s.activeBotId);
  const botId = activeBotId || 0;
  useCrmWebSocket(botId);

  const { data: conversations = [], isLoading: isConvLoading } = useConversationsQuery(botId);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const { data: messages = [], isLoading: isMsgLoading } = useMessagesQuery(selectedConvId || 0);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(true);
  const [bottomTab, setBottomTab] = useState<BottomTab>('reply');
  const [typedNote, setTypedNote] = useState('');

  const ls = useChatLocalStorage({ conversations, selectedConvId });
  const actions = useChatActions({ selectedConvId, botId });
  const filters = useChatFilters({ conversations, favorites: ls.favorites, unreadConvIds: ls.unreadConvIds });

  const selectedConversation = conversations.find(c => c.id === selectedConvId) ?? null;

  const handleSelectConv = (id: number) => {
    setSelectedConvId(id);
    ls.markAsRead(id);
  };

  useEffect(() => {
    if (selectedConvId) setTypedNote(ls.contactNotes[selectedConvId] || '');
  }, [selectedConvId]);

  if (botId === 0) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center p-8 text-center bg-slate-50">
          <div className="max-w-sm space-y-3">
            <AlertCircle size={40} className="text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No active bot found</p>
            <p className="text-xs text-slate-400">Please connect a bot first to access the chat.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col bg-white font-sans overflow-hidden w-full max-w-full">
        <style>{`
          .scrollbar-none::-webkit-scrollbar { display: none; }
          .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

        <ChatHeader searchQuery={filters.searchQuery} onSearchChange={filters.setSearchQuery} />

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
                      messages={messages}
                      isMsgLoading={isMsgLoading}
                      onButtonClick={(label) => actions.setTypedMessage(label)}
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
                      onSaveNote={() => ls.saveNote(typedNote)}
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
              conversation={selectedConversation}
              isOpen={infoPanelOpen}
              onClose={() => setInfoPanelOpen(false)}
              onOpen={() => setInfoPanelOpen(true)}
              contactTags={ls.contactTags[selectedConvId!] || []}
              showAddTag={ls.showAddTag}
              onShowAddTag={ls.setShowAddTag}
              newTagName={ls.newTagName}
              onNewTagNameChange={ls.setNewTagName}
              onAddTag={ls.addTag}
              onRemoveTag={ls.removeTag}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
