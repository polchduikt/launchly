import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import {
  CreateAutomationModal,
  EditAutomationModal,
  MoveAutomationModal,
  CreateFolderModal,
  BlockedDetailsModal,
  AutomationsSidebar,
  AutomationContextMenu,
  AutomationsTableView,
  AutomationsGridView,
} from './components';
import {
  Search,
  FolderPlus,
  Plus,
  Trash2,
  LayoutGrid,
  List,
  Loader2,
} from 'lucide-react';
import { useBotStore } from '../../../store/useBotStore';
import { getAutomationFoldersApi, saveAutomationFoldersApi } from '../../../api/bot';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { useTranslation } from '../../../i18n/config';
import {
  useCreateBotMutation,
  useDeleteBotMutation,
  useStartBotMutation,
  useStopBotMutation,
  useUpdateBotMutation,
} from '../../../hooks/bot/useBotMutations';

import type { Folder, BotResponse } from '../../../types/bot';
import {
  DISPLAY_KEY_AUTO_RUNS,
  DISPLAY_KEY_AUTO_CTR,
  DISPLAY_KEY_AUTO_BADGE,
} from '../FlowBuilder/components/DisplayPanel';

export const AutomationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedBotIds, setSelectedBotIds] = useState<Set<number>>(new Set());
  const { data: bots = [], isLoading } = useBotsQuery();

  const [showRuns, setShowRuns] = useState(
    () => localStorage.getItem(DISPLAY_KEY_AUTO_RUNS) !== 'false'
  );
  const [showCtr, setShowCtr] = useState(
    () => localStorage.getItem(DISPLAY_KEY_AUTO_CTR) !== 'false'
  );
  const [showBadge, setShowBadge] = useState(
    () => localStorage.getItem(DISPLAY_KEY_AUTO_BADGE) !== 'false'
  );

  useEffect(() => {
    const handler = () => {
      setShowRuns(localStorage.getItem(DISPLAY_KEY_AUTO_RUNS) !== 'false');
      setShowCtr(localStorage.getItem(DISPLAY_KEY_AUTO_CTR) !== 'false');
      setShowBadge(localStorage.getItem(DISPLAY_KEY_AUTO_BADGE) !== 'false');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const handleToggleSelectBot = (botId: number) => {
    setSelectedBotIds((prev) => {
      const next = new Set(prev);
      if (next.has(botId)) {
        next.delete(botId);
      } else {
        next.add(botId);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedBotIds((prev) => {
      const allSelected = filteredBots.length > 0 && filteredBots.every((b) => prev.has(b.id));
      if (allSelected) {
        const next = new Set(prev);
        filteredBots.forEach((b) => next.delete(b.id));
        return next;
      } else {
        const next = new Set(prev);
        filteredBots.forEach((b) => next.add(b.id));
        return next;
      }
    });
  };

  const createBotMutation = useCreateBotMutation();
  const deleteBotMutation = useDeleteBotMutation();
  const startBotMutation = useStartBotMutation();
  const stopBotMutation = useStopBotMutation();
  const updateBotMutation = useUpdateBotMutation();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [botFolders, setBotFolders] = useState<Record<number, string | number>>({});

  const handleBulkDelete = () => {
    if (selectedBotIds.size === 0) return;
    setConfirmDialog({
      title: t('automations.bulk_delete_title', 'Видалити автоматизації'),
      message: t('automations.bulk_delete_desc', 'Ви впевнені, що хочете видалити {{count}} обрану(их) автоматизацію(ій)?', { count: selectedBotIds.size }),
      variant: 'danger',
      confirmLabel: t('common.delete', 'Видалити'),
      onConfirm: async () => {
        const ids = Array.from(selectedBotIds);
        setConfirmDialog(null);
        const results = await Promise.allSettled(ids.map((id) => deleteBotMutation.mutateAsync(id)));
        const successfulIds = new Set(
          ids.filter((_, idx) => results[idx].status === 'fulfilled')
        );
        setBotFolders((prev) => {
          const updated = { ...prev };
          successfulIds.forEach((id) => delete updated[id]);
          return updated;
        });
        setSelectedBotIds((prev) => {
          const next = new Set(prev);
          successfulIds.forEach((id) => next.delete(id));
          return next;
        });
      },
    });
  };

  useEffect(() => {
    getAutomationFoldersApi()
      .then((data) => {
        if (data && typeof data === 'object') {
          if (Array.isArray(data.folders)) setFolders(data.folders);
          if (data.botFolders && typeof data.botFolders === 'object') setBotFolders(data.botFolders as Record<number, string | number>);
        }
      })
      .catch((err) => console.error('Failed to fetch automation folders:', err));
  }, []);

  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    saveAutomationFoldersApi({ folders, botFolders }).catch((err) =>
      console.error('Failed to save automation folders:', err)
    );
  }, [folders, botFolders]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | number | null>(null);
  const [activeMenuBotId, setActiveMenuBotId] = useState<number | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null);
  const [isNewBotModalOpen, setIsNewBotModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [selectedBotOption, setSelectedBotOption] = useState<string>('nobot');
  const [newBotToken, setNewBotToken] = useState('');
  const [newBotDesc, setNewBotDesc] = useState('');
  const [newBotError, setNewBotError] = useState<string | null>(null);
  const [editBotId, setEditBotId] = useState<number | null>(null);
  const [editBotName, setEditBotName] = useState('');
  const [editBotDesc, setEditBotDesc] = useState('');
  const [editBotOption, setEditBotOption] = useState<string>('keep');
  const [editBotToken, setEditBotToken] = useState('');
  const [editBotError, setEditBotError] = useState<string | null>(null);
  const [moveBotId, setMoveBotId] = useState<number | null>(null);
  const [tempFolderId, setTempFolderId] = useState('');
  const [tempFolderName, setTempFolderName] = useState('');
  const [blockedDetailsBot, setBlockedDetailsBot] = useState<BotResponse | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    variant?: 'danger' | 'warning' | 'default';
    confirmLabel?: string;
    onConfirm: () => void;
  } | null>(null);




  useEffect(() => {
    const handleClose = () => {
      setActiveMenuBotId(null);
      setMenuCoords(null);
    };
    document.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      document.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const getFolderBotCount = (folderId: string | number | null) => {
    if (folderId === null) {
      return bots.length;
    }
    return bots.filter((b) => botFolders[b.id] === folderId).length;
  };

  const handleMenuClick = (e: React.MouseEvent, botId: number) => {
    e.stopPropagation();
    if (activeMenuBotId === botId) {
      setActiveMenuBotId(null);
      setMenuCoords(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuCoords({
        top: rect.bottom + 6,
        left: rect.right - 192,
      });
      setActiveMenuBotId(botId);
    }
  };

  const handleBotClick = (bot: BotResponse) => {
    if (bot.blocked) {
      setBlockedDetailsBot(bot);
      return;
    }
    setActiveBotId(bot.id);
    navigate('/builder');
  };

  const handleMenuEdit = (bot: BotResponse) => {
    setEditBotId(bot.id);
    setEditBotName(bot.name);
    setEditBotDesc(bot.description || '');
    setEditBotOption(bot.username ? 'current' : 'nobot');
    setEditBotToken('');
    setIsEditModalOpen(true);
    setActiveMenuBotId(null);
    setMenuCoords(null);
  };

  const handleMenuMove = (bot: BotResponse) => {
    setMoveBotId(bot.id);
    setTempFolderId(String(botFolders[bot.id] || ''));
    setIsMoveModalOpen(true);
    setActiveMenuBotId(null);
    setMenuCoords(null);
  };

  const handleStartBot = (id: number) => {
    startBotMutation.mutate(id, {
      onSuccess: () => {
        setActiveMenuBotId(null);
        setMenuCoords(null);
      },
    });
  };

  const handleStopBot = (id: number) => {
    stopBotMutation.mutate(id, {
      onSuccess: () => {
        setActiveMenuBotId(null);
        setMenuCoords(null);
      },
    });
  };

  const handleDeleteBot = (id: number) => {
    setConfirmDialog({
      title: t('automations.delete_modal_title', 'Видалити автоматизацію'),
      message: t('automations.delete_modal_desc', 'Ви впевнені, що хочете видалити цю автоматизацію? Цю дію неможливо скасувати.'),
      variant: 'danger',
      confirmLabel: t('common.delete', 'Видалити'),
      onConfirm: () => {
        deleteBotMutation.mutate(id, {
          onSuccess: () => {
            const updated = { ...botFolders };
            delete updated[id];
            setBotFolders(updated);
            setActiveMenuBotId(null);
            setMenuCoords(null);
          },
        });
        setConfirmDialog(null);
      },
    });
  };

  const handleEditBot = () => {
    if (!editBotName.trim() || editBotId === null) return;
    if (editBotOption === 'new' && !editBotToken.trim()) {
      setEditBotError('Telegram Bot Token is required');
      return;
    }
    setEditBotError(null);

    const token = editBotOption === 'new' ? editBotToken.trim() : (editBotOption === 'nobot' ? '0000000000:dummyTokenPlaceholderForNoBotConfig' : undefined);
    const copyTokenFromBotId = (editBotOption !== 'new' && editBotOption !== 'nobot' && editBotOption !== 'keep')
      ? Number(editBotOption)
      : undefined;

    updateBotMutation.mutate(
      {
        id: editBotId,
        data: {
          name: editBotName.trim(),
          description: editBotDesc.trim() || undefined,
          telegramToken: token,
          copyTokenFromBotId,
        }
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          setEditBotId(null);
          setEditBotName('');
          setEditBotDesc('');
          setEditBotOption('keep');
          setEditBotToken('');
        },
        onError: (err: unknown) => {
          const errMsg =
            err instanceof Error ? err.message : t('automations.create.error_failed_update', 'Не вдалося оновити автоматизацію. Перевірте ваш токен.');
          setEditBotError(errMsg);
        },
      }
    );
  };

  const handleMoveBot = () => {
    if (moveBotId !== null) {
      const updated = { ...botFolders };
      if (tempFolderId) {
        updated[moveBotId] = tempFolderId;
      } else {
        delete updated[moveBotId];
      }
      setBotFolders(updated);
      setIsMoveModalOpen(false);
      setMoveBotId(null);
    }
  };

  const handleCreateFolder = () => {
    if (!tempFolderName.trim()) return;
    const newFolder: Folder = {
      id: `folder_${Date.now()}`,
      name: tempFolderName.trim(),
    };
    setFolders([...folders, newFolder]);
    setIsNewFolderModalOpen(false);
    setTempFolderName('');
  };

  const handleDeleteFolder = (folderId: string | number) => {
    setConfirmDialog({
      title: t('automations.delete_folder_title', 'Видалити папку'),
      message: t('automations.delete_folder_desc', 'Ви впевнені? Всі автоматизації з папки будуть переміщені до кореневого списку.'),
      variant: 'danger',
      confirmLabel: t('common.delete', 'Видалити'),
      onConfirm: () => {
        setFolders(folders.filter((f) => f.id !== folderId));
        const updated = { ...botFolders };
        Object.keys(updated).forEach((botIdKey) => {
          const bId = Number(botIdKey);
          if (updated[bId] === folderId) {
            delete updated[bId];
          }
        });
        setBotFolders(updated);
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
        setConfirmDialog(null);
      },
    });
  };

  const handleCreateBotSubmit = () => {
    if (!newBotName.trim()) {
      setNewBotError(t('automations.create.error_name', "Назва бота є обов'язковою"));
      return;
    }
    if (selectedBotOption === 'new' && !newBotToken.trim()) {
      setNewBotError(t('automations.create.error_token', "Токен Telegram-бота є обов'язковим"));
      return;
    }
    setNewBotError(null);

    const token = selectedBotOption === 'new' ? newBotToken.trim() : undefined;
    const copyTokenFromBotId = (selectedBotOption !== 'new' && selectedBotOption !== 'nobot')
      ? Number(selectedBotOption)
      : undefined;

    createBotMutation.mutate(
      {
        name: newBotName.trim(),
        telegramToken: token,
        copyTokenFromBotId,
        description: newBotDesc.trim() || undefined,
      },
      {
        onSuccess: (newBot) => {
          if (selectedFolderId) {
            setBotFolders({ ...botFolders, [newBot.id]: selectedFolderId });
          }
          setIsNewBotModalOpen(false);
          setNewBotName('');
          setSelectedBotOption('nobot');
          setNewBotToken('');
          setNewBotDesc('');
          setActiveBotId(newBot.id);
          navigate('/builder');
        },
        onError: (err: unknown) => {
          const errMsg =
            err instanceof Error ? err.message : t('automations.create.error_failed', 'Не вдалося створити автоматизацію. Перевірте ваш токен.');
          setNewBotError(errMsg);
        },
      }
    );
  };

  const allAutomations = useMemo(() => {
    return bots;
  }, [bots]);

  const filteredBots = allAutomations.filter((bot) => {
    const matchesSearch = bot.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedFolderId !== null) {
      return botFolders[bot.id] === selectedFolderId;
    }
    return true;
  }).sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  return (
    <DashboardLayout>
      <ConfirmModal
        isOpen={!!confirmDialog}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        variant={confirmDialog?.variant ?? 'danger'}
        confirmLabel={confirmDialog?.confirmLabel ?? t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
      <div className="flex h-full min-h-screen bg-[#F2EBDD] font-['Geist',sans-serif]">
        <AutomationsSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onDeleteFolder={handleDeleteFolder}
          getFolderBotCount={getFolderBotCount}
        />

        <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-6 bg-[#F2EBDD]">
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#0A0A0A]">
            <h1 className="font-['Anybody',sans-serif] text-2xl font-black text-[#0A0A0A] uppercase tracking-tight">{t('automations.title')}</h1>
          </div>

          <div className="space-y-6 bg-white border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[4px_4px_0px_0px_#0A0A0A]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-['Anybody',sans-serif] text-lg font-black text-[#0A0A0A] uppercase tracking-tight">
                  {selectedFolderId
                    ? folders.find((f) => f.id === selectedFolderId)?.name || t('automations.sidebar.folders')
                    : t('automations.sidebar.my_automations')}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] bg-white hover:bg-[#0A0A0A] hover:text-white border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <FolderPlus size={14} />
                  <span>{t('automations.btn.new_folder')}</span>
                </button>
                <button
                  onClick={() => setIsNewBotModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase text-white bg-[#0A0A0A] hover:bg-white hover:text-[#0A0A0A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <Plus size={14} />
                  <span>{t('automations.btn.new_automation')}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="relative max-w-sm w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]" />
                <input
                  type="text"
                  placeholder={t('automations.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A]"
                />
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 text-xs text-[#0A0A0A] font-black uppercase select-none">
                <button
                  onClick={handleBulkDelete}
                  className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedBotIds.size > 0 
                      ? 'text-rose-600 font-black' 
                      : 'text-[#0A0A0A] hover:underline'
                  }`}
                >
                  <Trash2 size={14} className={selectedBotIds.size > 0 ? 'text-rose-600' : ''} />
                  <span>{t('automations.btn.trash')}</span>
                </button>
                <div className="h-4 w-0.5 bg-[#0A0A0A] hidden md:block" />
                <div className="flex items-center border-2 border-[#0A0A0A] rounded-xl p-0.5 bg-[#F2EBDD]">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'list' ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-white'
                    }`}
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid' ? 'bg-[#0A0A0A] text-[#F2EBDD]' : 'text-[#0A0A0A] hover:bg-white'
                    }`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            <ErrorBoundary inline fallbackTitle="Automations Error">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs font-bold text-[#0A0A0A]">
                  <Loader2 size={24} className="animate-spin text-[#0A0A0A]" />
                  <span>{t('automations.loading')}</span>
                </div>
              ) : filteredBots.length > 0 ? (
                viewMode === 'list' ? (
                  <AutomationsTableView
                    bots={filteredBots}
                    selectedBotIds={selectedBotIds}
                    showRuns={showRuns}
                    showCtr={showCtr}
                    showBadge={showBadge}
                    onToggleSelectAll={handleToggleSelectAll}
                    onToggleSelectBot={handleToggleSelectBot}
                    onBotClick={handleBotClick}
                    onMenuClick={handleMenuClick}
                  />
                ) : (
                  <AutomationsGridView
                    bots={filteredBots}
                    showRuns={showRuns}
                    showCtr={showCtr}
                    showBadge={showBadge}
                    onBotClick={handleBotClick}
                    onMenuClick={handleMenuClick}
                  />
                )
              ) : (
                <div className="py-12 text-center text-xs font-bold text-[#0A0A0A] italic">
                  {t('automations.no_automations')}
                </div>
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {activeMenuBotId !== null && menuCoords !== null && (
        (() => {
          const activeMenuBot = bots.find((b) => b.id === activeMenuBotId);
          if (!activeMenuBot) return null;
          return (
            <AutomationContextMenu
              bot={activeMenuBot}
              menuCoords={menuCoords}
              onStart={handleStartBot}
              onStop={handleStopBot}
              onEdit={handleMenuEdit}
              onMove={handleMenuMove}
              onDelete={handleDeleteBot}
            />
          );
        })()
      )}

      <CreateAutomationModal
        isOpen={isNewBotModalOpen}
        onClose={() => setIsNewBotModalOpen(false)}
        onSubmit={handleCreateBotSubmit}
        isPending={createBotMutation.isPending}
        bots={bots}
        name={newBotName}
        setName={setNewBotName}
        selectedBotOption={selectedBotOption}
        setSelectedBotOption={setSelectedBotOption}
        botToken={newBotToken}
        setBotToken={setNewBotToken}
        desc={newBotDesc}
        setDesc={setNewBotDesc}
        error={newBotError}
        setError={setNewBotError}
      />

      <EditAutomationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditBot}
        isPending={updateBotMutation.isPending}
        bots={bots}
        editBotId={editBotId}
        name={editBotName}
        setName={setEditBotName}
        option={editBotOption}
        setOption={setEditBotOption}
        botToken={editBotToken}
        setBotToken={setEditBotToken}
        desc={editBotDesc}
        setDesc={setEditBotDesc}
        error={editBotError}
        setError={setEditBotError}
      />

      <MoveAutomationModal
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        onSubmit={handleMoveBot}
        folders={folders}
        tempFolderId={tempFolderId}
        setTempFolderId={setTempFolderId}
      />

      <CreateFolderModal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        onSubmit={handleCreateFolder}
        folderName={tempFolderName}
        setFolderName={setTempFolderName}
      />

      <BlockedDetailsModal
        bot={blockedDetailsBot}
        onClose={() => setBlockedDetailsBot(null)}
      />
    </DashboardLayout>
  );
};
