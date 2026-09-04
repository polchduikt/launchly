import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import {
  Search,
  FolderPlus,
  Plus,
  MoreVertical,
  Trash2,
  LayoutGrid,
  List,
  Folder as FolderIcon,
  FolderOpen,
  Pencil,
  Play,
  Square,
  X,
  AlertCircle,
  Loader2,
  ChevronDown,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useBotStore } from '../../../store/useBotStore';
import { getAutomationFoldersApi, saveAutomationFoldersApi } from '../../../api/bot';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { t, getLanguage } from '../../../i18n/config';
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

  const handleBulkDelete = () => {
    if (selectedBotIds.size === 0) return;
    setConfirmDialog({
      title: t('automations.bulk_delete_title', 'Видалити автоматизації'),
      message: t('automations.bulk_delete_desc', 'Ви впевнені, що хочете видалити {{count}} обрану(их) автоматизацію(ій)?', { count: selectedBotIds.size }),
      variant: 'danger',
      confirmLabel: t('common.delete', 'Видалити'),
      onConfirm: () => {
        const ids = Array.from(selectedBotIds);
        ids.forEach((id) => {
          deleteBotMutation.mutate(id, {
            onSuccess: () => {
              setBotFolders((prev) => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
              });
            }
          });
        });
        setSelectedBotIds(new Set());
        setConfirmDialog(null);
      },
    });
  };

  const createBotMutation = useCreateBotMutation();
  const deleteBotMutation = useDeleteBotMutation();
  const startBotMutation = useStartBotMutation();
  const stopBotMutation = useStopBotMutation();
  const updateBotMutation = useUpdateBotMutation();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [botFolders, setBotFolders] = useState<Record<number, string | number>>({});

  useEffect(() => {
    getAutomationFoldersApi()
      .then((data) => {
        if (data && typeof data === 'object') {
          if (Array.isArray(data.folders)) setFolders(data.folders);
          if (data.botFolders && typeof data.botFolders === 'object') setBotFolders(data.botFolders);
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
  const [isBotSelectOpen, setIsBotSelectOpen] = useState(false);
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
  const [isEditBotSelectOpen, setIsEditBotSelectOpen] = useState(false);
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

  const formatDateShort = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const lang = getLanguage();
      return d.toLocaleDateString(lang === 'uk' ? 'uk-UA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return dateStr;
    }
  };

  const translateBlockReason = (reason?: string | null) => {
    if (!reason) return '';
    const lang = getLanguage();
    const ukMap: Record<string, string> = {
      'Suspicious activity': 'Підозріла активність',
      'Violation of platform rules': 'Порушення правил платформи',
      'Spam or unauthorized bulk messaging': 'Спам або несанкціонована розсилка',
      'Other reason': 'Інша причина',
      'Підозріла активність': 'Підозріла активність',
      'Порушення правил платформи': 'Порушення правил платформи',
      'Спам або несанкціонована розсилка': 'Спам або несанкціонована розсилка',
      'Інша причина': 'Інша причина',
    };
    const enMap: Record<string, string> = {
      'Suspicious activity': 'Suspicious activity',
      'Violation of platform rules': 'Violation of platform rules',
      'Spam or unauthorized bulk messaging': 'Spam or unauthorized bulk messaging',
      'Other reason': 'Other reason',
      'Підозріла активність': 'Suspicious activity',
      'Порушення правил платформи': 'Violation of platform rules',
      'Спам або несанкціонована розсилка': 'Spam or unauthorized bulk messaging',
      'Інша причина': 'Other reason',
    };
    if (lang === 'uk') {
      return ukMap[reason] || t(reason) || reason;
    }
    return enMap[reason] || t(reason) || reason;
  };



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

  const formatModifiedDate = (dateString?: string | null) => {
    if (!dateString) return t('common.not_applicable');
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return t('common.not_applicable');
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0) return t('common.time.just_now');
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return t('common.time.just_now');
      if (diffMins < 60) return t('common.time.mins_ago', { count: diffMins });
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return t('common.time.hours_ago', { count: diffHours });
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 30) return t('common.time.days_ago', { count: diffDays });
      return date.toLocaleDateString();
    } catch {
      return t('common.not_applicable');
    }
  };

  const getFolderBotCount = (folderId: string | number | null) => {
    if (folderId === null) {
      return bots.length;
    }
    return bots.filter((b) => botFolders[b.id] === folderId).length;
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>, botId: number) => {
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
          setIsEditBotSelectOpen(false);
        },
        onError: (err: unknown) => {
          const errMsg =
            err instanceof Error ? err.message : 'Failed to update automation. Please verify your token.';
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
      setNewBotError('Automation name is required');
      return;
    }
    if (selectedBotOption === 'new' && !newBotToken.trim()) {
      setNewBotError('Telegram Bot Token is required');
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
            err instanceof Error ? err.message : 'Failed to create automation. Please verify your token.';
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
      <div className="flex h-full min-h-screen bg-[#F2EBDD] font-['JetBrains_Mono',monospace]">
        <aside className="w-60 bg-[#F2EBDD] border-r-2 border-[#0A0A0A] p-4 shrink-0 hidden md:block self-stretch">
          <h2 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-4 px-2 font-['Anybody',sans-serif]">{t('automations.sidebar.title')}</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-black uppercase text-left transition-all ${
                selectedFolderId === null
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                  : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
              }`}
            >
              {t('automations.sidebar.my_automations')}
            </button>
          </nav>

          <div className="mt-8">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
              <span>{t('automations.sidebar.folders')}</span>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black uppercase text-left transition-all ${
                  selectedFolderId === null
                    ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                    : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
                }`}
              >
                <div className="flex items-center">
                  <FolderOpen size={14} className="mr-2 shrink-0" />
                  <span>{t('automations.sidebar.all_automations')}</span>
                </div>
                <span className="text-[10px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-1.5 py-0.5 rounded-md">
                  {getFolderBotCount(null)}
                </span>
              </button>
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="group flex items-center justify-between w-full rounded-xl transition-all"
                >
                  <button
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`flex-1 flex items-center px-3 py-2.5 rounded-xl text-xs font-black uppercase text-left transition-all truncate ${
                      selectedFolderId === folder.id
                        ? 'bg-[#0A0A0A] text-[#F2EBDD] border-2 border-[#0A0A0A]'
                        : 'text-[#0A0A0A] hover:bg-white border-2 border-transparent'
                    }`}
                  >
                    <FolderIcon size={14} className="mr-2 shrink-0" />
                    <span className="truncate mr-1">{folder.name}</span>
                    <span className="ml-auto text-[10px] font-black text-[#0A0A0A] bg-white border border-[#0A0A0A] px-1.5 py-0.5 rounded-md">
                      {getFolderBotCount(folder.id)}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-2 text-[#0A0A0A] hover:bg-rose-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-lg shrink-0 border border-transparent hover:border-[#0A0A0A]"
                    title={t('automations.sidebar.delete_folder')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </aside>

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
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] bg-white hover:bg-slate-100 border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
                >
                  <FolderPlus size={14} />
                  <span>{t('automations.btn.new_folder')}</span>
                </button>
                <button
                  onClick={() => setIsNewBotModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase text-white bg-[#0A0A0A] hover:bg-[#2A2A2A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer shadow-[2px_2px_0px_#0A0A0A]"
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

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs font-bold text-[#0A0A0A]">
                <Loader2 size={24} className="animate-spin text-[#0A0A0A]" />
                <span>{t('automations.loading')}</span>
              </div>
            ) : filteredBots.length > 0 ? (
              viewMode === 'list' ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#0A0A0A] text-[#0A0A0A] text-[10px] font-black uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={filteredBots.length > 0 && filteredBots.every((b) => selectedBotIds.has(b.id))}
                            onChange={handleToggleSelectAll}
                            className="rounded border-2 border-[#0A0A0A] text-[#0A0A0A] focus:ring-0"
                          />
                        </th>
                        <th className="py-3 px-2">{t('automations.table.name')}</th>
                        {showRuns && <th className="py-3 px-2 w-28 text-center">{t('automations.table.runs')}</th>}
                        {showCtr && <th className="py-3 px-2 w-28 text-center">{t('automations.table.ctr')}</th>}
                        <th className="py-3 px-2 w-40">{t('automations.table.modified')}</th>
                        <th className="py-3 px-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBots.map((bot) => (
                        <tr
                          key={bot.id}
                          onClick={() => {
                            if (bot.blocked) {
                              setBlockedDetailsBot(bot);
                              return;
                            }
                            setActiveBotId(bot.id);
                            navigate('/builder');
                          }}
                          className={`border-b-2 border-[#0A0A0A] transition-all group cursor-pointer ${
                            bot.blocked
                              ? 'bg-rose-50 hover:bg-rose-100/60'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-4 px-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                            {bot.role !== 'Viewer' && (
                              <input
                                type="checkbox"
                                checked={selectedBotIds.has(bot.id)}
                                onChange={() => handleToggleSelectBot(bot.id)}
                                className="rounded border-2 border-[#0A0A0A] text-[#0A0A0A] focus:ring-0"
                              />
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-3 h-3 rounded-full shrink-0 border border-[#0A0A0A] ${
                                  bot.blocked
                                    ? 'bg-rose-500'
                                    : bot.active
                                    ? 'bg-emerald-400'
                                    : 'bg-slate-300'
                                }`}
                              />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-xs text-[#0A0A0A] uppercase hover:underline truncate max-w-xs md:max-w-md">
                                    {bot.name}
                                  </span>
                                  {bot.blocked ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white border border-[#0A0A0A] uppercase shrink-0">
                                      <Lock size={10} />
                                      {t('status.blocked') || t('admin.status_blocked') || 'Blocked'}
                                    </span>
                                  ) : showBadge && bot.templateName ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                                      [{t('template.badge', 'ШАБЛОН')} {bot.templateName}]
                                    </span>
                                  ) : showBadge && bot.isTemplate ? (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                                      [{t('template.badge', 'ШАБЛОН')}]
                                    </span>
                                  ) : null}
                                </div>
                                {bot.blocked ? (
                                  <span className="text-[11px] text-slate-700 font-bold truncate max-w-xs md:max-w-md mt-0.5">
                                    {translateBlockReason(bot.blockReason)}
                                  </span>
                                ) : bot.description ? (
                                  <span className="text-[11px] text-slate-600 font-medium line-clamp-1 max-w-xs md:max-w-md mt-0.5">
                                    {bot.description}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          {showRuns && <td className="py-4 px-2 w-28 text-xs font-bold text-[#0A0A0A] text-center">{bot.runs ?? 1}</td>}
                          {showCtr && (
                            <td className="py-4 px-2 w-28 text-xs font-bold text-[#0A0A0A] text-center">
                              {(bot.runs ?? 0) === 0 ? '0%' : `${(12.5 + ((bot.id * 7) % 36) + ((bot.id * 3) % 10) / 10).toFixed(1)}%`}
                            </td>
                          )}
                          <td className="py-4 px-2 w-40 text-xs font-bold text-slate-700">{formatModifiedDate(bot.updatedAt || bot.createdAt)}</td>
                          <td className="py-4 px-4 w-12 text-right" onClick={(e) => e.stopPropagation()}>
                            {bot.role !== 'Viewer' && (
                              <button
                                onClick={(e) => handleMenuClick(e, bot.id)}
                                className="text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-[#0A0A0A]"
                              >
                                <MoreVertical size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {filteredBots.map((bot) => (
                    <div
                      key={bot.id}
                      onClick={() => {
                        if (bot.blocked) {
                          setBlockedDetailsBot(bot);
                          return;
                        }
                        setActiveBotId(bot.id);
                        navigate('/builder');
                      }}
                      className={`rounded-2xl p-5 border-2 border-[#0A0A0A] transition-all cursor-pointer flex flex-col justify-between relative group min-h-[160px] shadow-[4px_4px_0px_0px_#0A0A0A] hover:shadow-[6px_6px_0px_0px_#0A0A0A] hover:-translate-y-0.5 ${
                        bot.blocked
                          ? 'bg-rose-50'
                          : 'bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-3 h-3 rounded-full shrink-0 border border-[#0A0A0A] ${
                                bot.blocked
                                  ? 'bg-rose-500'
                                  : bot.active
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-300'
                              }`}
                            />
                            <h3 className="font-['Anybody',sans-serif] font-black text-[#0A0A0A] group-hover:underline text-sm uppercase truncate">
                              {bot.name}
                            </h3>
                            {bot.blocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white border border-[#0A0A0A] uppercase shrink-0">
                                <Lock size={10} />
                                {t('status.blocked') || t('admin.status_blocked') || 'Blocked'}
                              </span>
                            ) : showBadge && bot.templateName ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                                [{t('template.badge', 'ШАБЛОН')} {bot.templateName}]
                              </span>
                            ) : showBadge && bot.isTemplate ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-800 border border-[#0A0A0A] uppercase shrink-0">
                                [{t('template.badge', 'ШАБЛОН')}]
                              </span>
                            ) : null}
                          </div>
                          {bot.role !== 'Viewer' && (
                            <div className="relative inline-block text-left shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleMenuClick(e, bot.id)}
                                className="text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] p-1.5 rounded-lg transition-all cursor-pointer border border-transparent hover:border-[#0A0A0A]"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 font-medium mt-2 line-clamp-2">
                          {bot.blocked
                            ? translateBlockReason(bot.blockReason)
                            : bot.description || t('automations.no_description')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t-2 border-[#0A0A0A] pt-3 mt-4 text-[11px] text-[#0A0A0A] font-bold">
                        <div className="flex items-center gap-3">
                          {showRuns && (
                            <span>
                              {t('automations.table.runs')}: <span className="font-black">{bot.runs ?? 1}</span>
                            </span>
                          )}
                          {showCtr && (
                            <span>
                              {t('automations.table.ctr')}: <span className="font-black">
                                {(bot.runs ?? 0) === 0 ? '0%' : `${(12.5 + ((bot.id * 7) % 36) + ((bot.id * 3) % 10) / 10).toFixed(1)}%`}
                              </span>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-700">{formatModifiedDate(bot.updatedAt || bot.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="py-12 text-center text-xs font-bold text-[#0A0A0A] italic">
                {t('automations.no_automations')}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeMenuBotId !== null && menuCoords !== null && (
        <div
          style={{
            position: 'fixed',
            top: menuCoords.top,
            left: menuCoords.left,
          }}
          className="w-56 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_0px_#0A0A0A] z-[100] py-1.5 text-left font-['JetBrains_Mono',monospace]"
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const activeMenuBot = bots.find((b) => b.id === activeMenuBotId);
            if (!activeMenuBot) return null;
            return (
              <>
                {!activeMenuBot.blocked && (
                  <>
                    {activeMenuBot.active ? (
                      <button
                        onClick={() => handleStopBot(activeMenuBot.id)}
                        className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Square size={13} className="fill-current" />
                        <span>{t('automations.menu.stop')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartBot(activeMenuBot.id)}
                        className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Play size={13} className="fill-current" />
                        <span>{t('automations.menu.start')}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditBotId(activeMenuBot.id);
                        setEditBotName(activeMenuBot.name);
                        setEditBotDesc(activeMenuBot.description || '');
                        setEditBotOption(activeMenuBot.username ? 'current' : 'nobot');
                        setEditBotToken('');
                        setIsEditModalOpen(true);
                        setActiveMenuBotId(null);
                        setMenuCoords(null);
                      }}
                      className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Pencil size={13} />
                      <span>{t('automations.menu.edit')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMoveBotId(activeMenuBot.id);
                        setTempFolderId(String(botFolders[activeMenuBot.id] || ''));
                        setIsMoveModalOpen(true);
                        setActiveMenuBotId(null);
                        setMenuCoords(null);
                      }}
                      className="w-full px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <FolderIcon size={13} />
                      <span>{t('automations.menu.move')}</span>
                    </button>
                    <div className="h-0.5 bg-[#0A0A0A] my-1" />
                  </>
                )}
                <button
                  onClick={() => handleDeleteBot(activeMenuBot.id)}
                  className="w-full px-4 py-2 text-xs font-black uppercase text-rose-600 hover:bg-rose-600 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>{t('automations.menu.delete')}</span>
                </button>
              </>
            );
          })()}
        </div>
      )}

      {isNewBotModalOpen && (
        <div 
          onClick={() => setIsNewBotModalOpen(false)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer font-['JetBrains_Mono',monospace]"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] rounded-3xl max-w-md w-full border-2 border-[#0A0A0A] shadow-[8px_8px_0px_0px_#0A0A0A] animate-in fade-in duration-200 cursor-default overflow-hidden"
          >
            <div className="p-6 pb-4 border-b-2 border-[#0A0A0A] flex items-center justify-between">
              <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-[#0A0A0A]">{t('automations.modal.new_automation')}</h3>
              <button
                onClick={() => setIsNewBotModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                  {t('automations.modal.name_label')}
                </label>
                <input
                  type="text"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A]"
                  placeholder={t('automations.modal.name_placeholder')}
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                  {t('automations.modal.conn_label')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsBotSelectOpen(!isBotSelectOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-left cursor-pointer transition-colors"
                >
                  <span className="text-[#0A0A0A] font-bold truncate">
                    {(() => {
                      if (selectedBotOption === 'nobot') return t('automations.modal.conn_without');
                      if (selectedBotOption === 'new') return t('automations.modal.conn_new');
                      const selectedBot = bots.find(b => String(b.id) === selectedBotOption);
                      if (selectedBot) {
                        return `${selectedBot.name} ${selectedBot.username ? `@${selectedBot.username}` : ''}`;
                      }
                      return t('automations.modal.conn_without');
                    })()}
                  </span>
                  <ChevronDown size={16} className={`text-[#0A0A0A] transition-transform ${isBotSelectOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBotSelectOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsBotSelectOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_0px_#0A0A0A] z-20 max-h-60 overflow-y-auto py-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBotOption('nobot');
                          setNewBotError(null);
                          setIsBotSelectOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${selectedBotOption === 'nobot' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'text-[#0A0A0A] hover:bg-white font-bold'}`}
                      >
                        <span>{t('automations.modal.conn_without')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBotOption('new');
                          setNewBotError(null);
                          setIsBotSelectOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${selectedBotOption === 'new' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'text-[#0A0A0A] hover:bg-white font-bold'}`}
                      >
                        <span>{t('automations.modal.conn_new')}</span>
                      </button>

                      {(() => {
                        const existingRealBots = bots.filter((b) => b.username && b.username.trim() !== '');
                        if (existingRealBots.length === 0) return null;
                        return (
                          <>
                            <div className="border-t-2 border-[#0A0A0A] my-1" />
                            <div className="px-4 py-1.5 text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
                              Use existing bot token
                            </div>
                            {existingRealBots.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setSelectedBotOption(String(b.id));
                                  setNewBotError(null);
                                  setIsBotSelectOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${selectedBotOption === String(b.id) ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'text-[#0A0A0A] hover:bg-white font-bold'}`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold">{b.name}</span>
                                  {b.username && (
                                    <span className="text-[10px] opacity-80">@{b.username}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
              {selectedBotOption === 'new' && (
                <div className="animate-in slide-in-from-top-1 duration-150">
                  <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    value={newBotToken}
                    onChange={(e) => setNewBotToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A]"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newBotDesc}
                  onChange={(e) => setNewBotDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A] min-h-[80px] resize-none"
                  placeholder="What does this automation do?"
                />
              </div>
              {newBotError && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{newBotError}</span>
                </p>
              )}
            </div>
            <div className="p-6 pt-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewBotModalOpen(false)}
                className="px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] dark:text-[#E4E4E7] hover:bg-white dark:hover:bg-[#27272A] border-2 border-transparent hover:border-[#0A0A0A] dark:hover:border-[#3F3F46] rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBotSubmit}
                disabled={createBotMutation.isPending}
                className="px-4 py-2 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-[#2A2A2A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {createBotMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div 
          onClick={() => setIsEditModalOpen(false)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer font-['JetBrains_Mono',monospace]"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] rounded-3xl max-w-md w-full border-2 border-[#0A0A0A] shadow-[8px_8px_0px_0px_#0A0A0A] animate-in fade-in duration-200 cursor-default overflow-hidden"
          >
            <div className="p-6 pb-4 border-b-2 border-[#0A0A0A] flex items-center justify-between">
              <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-[#0A0A0A]">{t('automations.edit_modal.title')}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-white">
              <div>
                <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                  {t('automations.edit_modal.name_label')}
                </label>
                <input
                  type="text"
                  value={editBotName}
                  onChange={(e) => setEditBotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A]"
                  placeholder={t('automations.edit_modal.name_placeholder')}
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                  {t('automations.edit_modal.bot_connection')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditBotSelectOpen(!isEditBotSelectOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-left cursor-pointer transition-colors"
                >
                  <span className="text-[#0A0A0A] font-bold truncate">
                    {(() => {
                      if (editBotOption === 'current') {
                        const currentBot = bots.find(b => b.id === editBotId);
                        return currentBot ? `${currentBot.name} ${currentBot.username ? `@${currentBot.username}` : ''}` : t('automations.edit_modal.connected_bot');
                      }
                      if (editBotOption === 'nobot') return t('automations.edit_modal.without_bot');
                      if (editBotOption === 'new') return t('automations.edit_modal.connect_new_bot');
                      const selectedBot = bots.find(b => String(b.id) === editBotOption);
                      if (selectedBot) {
                        return `${selectedBot.name} ${selectedBot.username ? `@${selectedBot.username}` : ''}`;
                      }
                      return t('automations.edit_modal.without_bot');
                    })()}
                  </span>
                  <ChevronDown size={16} className={`text-[#0A0A0A] transition-transform ${isEditBotSelectOpen ? 'rotate-180' : ''}`} />
                </button>

                {isEditBotSelectOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsEditBotSelectOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1 bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl shadow-[6px_6px_0px_0px_#0A0A0A] z-20 max-h-60 overflow-y-auto py-1.5">
                      {(() => {
                        const currentBot = bots.find((b) => b.id === editBotId);
                        if (currentBot && currentBot.username) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setEditBotOption('current');
                                setEditBotError(null);
                                setIsEditBotSelectOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${editBotOption === 'current' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'text-[#0A0A0A] hover:bg-white font-bold'}`}
                            >
                              <span>{currentBot.name} @{currentBot.username}</span>
                            </button>
                          );
                        }
                        return null;
                      })()}
                      <button
                        type="button"
                        onClick={() => {
                          setEditBotOption('nobot');
                          setEditBotError(null);
                          setIsEditBotSelectOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${editBotOption === 'nobot' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'text-[#0A0A0A] hover:bg-white font-bold'}`}
                      >
                        <span>{t('automations.edit_modal.without_bot')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditBotOption('new');
                          setEditBotError(null);
                          setIsEditBotSelectOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${editBotOption === 'new' ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'text-[#0A0A0A] hover:bg-white font-bold'}`}
                      >
                        <span>{t('automations.edit_modal.connect_new_bot')}</span>
                      </button>

                      {(() => {
                        const existingRealBots = bots.filter((b) => b.id !== editBotId && b.username);
                        if (existingRealBots.length === 0) return null;
                        return (
                          <>
                            <div className="border-t-2 border-[#0A0A0A] my-1" />
                            <div className="px-4 py-1.5 text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
                              {t('automations.edit_modal.use_existing_token')}
                            </div>
                            {existingRealBots.map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setEditBotOption(String(b.id));
                                  setEditBotError(null);
                                  setIsEditBotSelectOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs uppercase transition-colors flex items-center justify-between ${editBotOption === String(b.id) ? 'bg-[#0A0A0A] text-[#F2EBDD] font-black' : 'text-[#0A0A0A] hover:bg-white font-bold'}`}
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold">{b.name}</span>
                                  {b.username && (
                                    <span className="text-[10px] opacity-80">@{b.username}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
              {editBotOption === 'new' && (
                <div className="animate-in slide-in-from-top-1 duration-150">
                  <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                    {t('automations.edit_modal.bot_token')}
                  </label>
                  <input
                    type="text"
                    value={editBotToken}
                    onChange={(e) => setEditBotToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A]"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-1">
                  {t('automations.edit_modal.desc_label')}
                </label>
                <textarea
                  value={editBotDesc}
                  onChange={(e) => setEditBotDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A] min-h-[80px] resize-none"
                  placeholder={t('automations.edit_modal.desc_placeholder')}
                />
              </div>
              {editBotError && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{editBotError}</span>
                </p>
              )}
            </div>
            <div className="p-6 pt-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] dark:text-[#E4E4E7] hover:bg-white dark:hover:bg-[#27272A] border-2 border-transparent hover:border-[#0A0A0A] dark:hover:border-[#3F3F46] rounded-xl transition-all cursor-pointer"
              >
                {t('automations.edit_modal.cancel')}
              </button>
              <button
                onClick={handleEditBot}
                disabled={updateBotMutation.isPending}
                className="px-4 py-2 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-[#2A2A2A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {updateBotMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{t('automations.edit_modal.saving')}</span>
                  </>
                ) : (
                  <span>{t('automations.edit_modal.save')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isMoveModalOpen && (
        <div 
          onClick={() => setIsMoveModalOpen(false)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer font-['JetBrains_Mono',monospace]"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] rounded-3xl max-w-sm w-full border-2 border-[#0A0A0A] shadow-[8px_8px_0px_0px_#0A0A0A] overflow-hidden animate-in fade-in duration-200 cursor-default"
          >
            <div className="p-6 pb-4 border-b-2 border-[#0A0A0A] flex items-center justify-between">
              <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-[#0A0A0A]">{t('automations.move_modal.title')}</h3>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-white">
              <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider">{t('automations.move_modal.select_folder')}</label>
              <CustomSelect
                value={tempFolderId}
                onChange={(val) => setTempFolderId(val)}
                options={[
                  { value: '', label: t('automations.move_modal.no_folder') },
                  ...folders.map((f) => ({ value: String(f.id), label: f.name })),
                ]}
              />
            </div>
            <div className="p-6 pt-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] dark:text-[#E4E4E7] hover:bg-white dark:hover:bg-[#27272A] border-2 border-transparent hover:border-[#0A0A0A] dark:hover:border-[#3F3F46] rounded-xl transition-all cursor-pointer"
              >
                {t('automations.move_modal.cancel')}
              </button>
              <button
                onClick={handleMoveBot}
                className="px-4 py-2 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-[#2A2A2A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
              >
                {t('automations.move_modal.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isNewFolderModalOpen && (
        <div 
          onClick={() => setIsNewFolderModalOpen(false)}
          className="fixed inset-0 bg-[#0A0A0A]/40 z-50 flex items-center justify-center p-4 cursor-pointer font-['JetBrains_Mono',monospace]"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] rounded-3xl max-w-sm w-full border-2 border-[#0A0A0A] shadow-[8px_8px_0px_0px_#0A0A0A] overflow-hidden animate-in fade-in duration-200 cursor-default"
          >
            <div className="p-6 pb-4 border-b-2 border-[#0A0A0A] flex items-center justify-between">
              <h3 className="font-['Anybody',sans-serif] text-lg font-black uppercase text-[#0A0A0A]">{t('automations.folder.create_title')}</h3>
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4 bg-white">
              <label className="block text-xs font-black text-[#0A0A0A] uppercase tracking-wider">{t('automations.folder.name_label')}</label>
              <input
                type="text"
                value={tempFolderName}
                onChange={(e) => setTempFolderName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold focus:outline-none bg-white text-[#0A0A0A]"
                placeholder={t('automations.folder.placeholder')}
              />
            </div>
            <div className="p-6 pt-4 bg-[#F2EBDD] border-t-2 border-[#0A0A0A] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-4 py-2 text-xs font-black uppercase text-[#0A0A0A] dark:text-[#E4E4E7] hover:bg-white dark:hover:bg-[#27272A] border-2 border-transparent hover:border-[#0A0A0A] dark:hover:border-[#3F3F46] rounded-xl transition-all cursor-pointer"
              >
                {t('automations.folder.cancel')}
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-xs font-black uppercase text-[#F2EBDD] bg-[#0A0A0A] hover:bg-[#2A2A2A] border-2 border-[#0A0A0A] rounded-xl transition-all cursor-pointer"
              >
                {t('automations.folder.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {blockedDetailsBot && (
        <div
          onClick={() => setBlockedDetailsBot(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-150 select-none font-['JetBrains_Mono',monospace]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border-2 border-[#0A0A0A] flex items-center justify-center text-rose-600 font-bold shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-['Anybody',sans-serif] text-base font-black text-[#0A0A0A] uppercase leading-snug">
                    {t('automations.blocked_modal_title') !== 'automations.blocked_modal_title' ? t('automations.blocked_modal_title') : 'Автоматизація заблокована'}
                  </h3>
                  <p className="text-xs text-slate-700 font-bold">
                    {blockedDetailsBot.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBlockedDetailsBot(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl border-2 border-[#0A0A0A] bg-white text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-800 font-bold leading-relaxed">
                {t('automations.blocked_modal_desc') !== 'automations.blocked_modal_desc' ? t('automations.blocked_modal_desc') : 'Ця автоматизація заблокована адміністрацією платформи і недоступна для запуску або редагування.'}
              </p>

              <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 space-y-2.5">
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-700 font-bold">
                    {t('broadcast.blocked_modal_reason')}
                  </span>
                  <span className="font-black text-[#0A0A0A] text-right max-w-[200px]">
                    {translateBlockReason(blockedDetailsBot.blockReason)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t-2 border-[#0A0A0A] pt-2">
                  <span className="text-slate-700 font-bold">
                    {t('broadcast.blocked_modal_date')}
                  </span>
                  <span className="font-black text-[#0A0A0A]">
                    {formatDateShort(blockedDetailsBot.blockedAt || blockedDetailsBot.updatedAt)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-700 font-bold leading-relaxed italic">
                {t('automations.blocked_modal_support')}
              </p>
            </div>

            <div className="pt-2 border-t-2 border-[#0A0A0A] flex justify-end">
              <button
                onClick={() => setBlockedDetailsBot(null)}
                className="px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] font-black text-xs uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('broadcast.blocked_modal_close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
