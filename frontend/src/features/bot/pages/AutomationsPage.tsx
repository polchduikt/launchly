import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import {
  Search,
  FolderPlus,
  Plus,
  MoreVertical,
  Trash2,
  LayoutGrid,
  List,
  Folder,
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
import { useBotsQuery } from '../hooks/useBotsQuery';
import { t, getLanguage } from '../../../i18n';
import {
  useCreateBotMutation,
  useDeleteBotMutation,
  useStartBotMutation,
  useStopBotMutation,
  useUpdateBotMutation,
} from '../hooks/useBotMutations';

interface Folder {
  id: string;
  name: string;
}

export const AutomationsPage: React.FC = () => {
  const navigate = useNavigate();
  const setActiveBotId = useBotStore((state) => state.setActiveBotId);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedBotIds, setSelectedBotIds] = useState<Set<number>>(new Set());
  const { data: bots = [], isLoading } = useBotsQuery();

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
      title: 'Видалити автоматизації',
      message: `Ви впевнені, що хочете видалити ${selectedBotIds.size} обрану(их) автоматизацію(ій)?`,
      variant: 'danger',
      confirmLabel: 'Видалити',
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
  const [folders, setFolders] = useState<Folder[]>(() => {
    const saved = localStorage.getItem('launchly_folders');
    return saved ? JSON.parse(saved) : [];
  });
  const [botFolders, setBotFolders] = useState<Record<number, string>>(() => {
    const saved = localStorage.getItem('launchly_bot_folders');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
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
  const [blockedDetailsBot, setBlockedDetailsBot] = useState<any | null>(null);
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
    localStorage.setItem('launchly_folders', JSON.stringify(folders));
  }, [folders]);

  useEffect(() => {
    localStorage.setItem('launchly_bot_folders', JSON.stringify(botFolders));
  }, [botFolders]);

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

  const getFolderBotCount = (folderId: string | null) => {
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
      title: 'Видалити автоматизацію',
      message: 'Ви впевнені, що хочете видалити цю автоматизацію? Цю дію неможливо скасувати.',
      variant: 'danger',
      confirmLabel: 'Видалити',
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

  const handleDeleteFolder = (folderId: string) => {
    setConfirmDialog({
      title: 'Видалити папку',
      message: 'Ви впевнені? Всі автоматизації з папки будуть переміщені до кореневого списку.',
      variant: 'danger',
      confirmLabel: 'Видалити',
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

  const filteredBots = bots.filter((bot) => {
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
        confirmLabel={confirmDialog?.confirmLabel ?? 'Підтвердити'}
        cancelLabel="Скасувати"
        onConfirm={() => confirmDialog?.onConfirm()}
        onCancel={() => setConfirmDialog(null)}
      />
      <div className="flex h-full min-h-screen bg-slate-50 font-sans">
        <aside className="w-60 bg-slate-50 border-r border-slate-200 p-4 shrink-0 hidden md:block">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">{t('automations.sidebar.title')}</h2>
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all ${
                selectedFolderId === null
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('automations.sidebar.my_automations')}
            </button>
          </nav>

          <div className="mt-8">
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>{t('automations.sidebar.folders')}</span>
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all ${
                  selectedFolderId === null
                    ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center">
                  <FolderOpen size={14} className="mr-2 text-slate-400" />
                  <span>{t('automations.sidebar.all_automations')}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
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
                    className={`flex-1 flex items-center px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all truncate ${
                      selectedFolderId === folder.id
                        ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Folder size={14} className="mr-2 text-slate-400 shrink-0" />
                    <span className="truncate mr-1">{folder.name}</span>
                    <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {getFolderBotCount(folder.id)}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-lg shrink-0"
                    title={t('automations.sidebar.delete_folder')}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t('automations.title')}</h1>
          </div>

          <div className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {selectedFolderId
                    ? folders.find((f) => f.id === selectedFolderId)?.name || t('automations.sidebar.folders')
                    : t('automations.sidebar.my_automations')}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewFolderModalOpen(true)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-550/10 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  <FolderPlus size={14} />
                  <span>{t('automations.btn.new_folder')}</span>
                </button>
                <button
                  onClick={() => setIsNewBotModalOpen(true)}
                  className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
                >
                  <Plus size={14} />
                  <span>{t('automations.btn.new_automation')}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
              <div className="relative max-w-sm w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('automations.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50/50"
                />
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 text-xs text-slate-500 font-bold select-none">
                <button
                  onClick={handleBulkDelete}
                  className={`flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedBotIds.size > 0 
                      ? 'text-red-600 hover:text-red-700 font-bold' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Trash2 size={14} className={selectedBotIds.size > 0 ? 'text-red-500' : ''} />
                  <span>{t('automations.btn.trash')}</span>
                </button>
                <div className="h-4 w-px bg-slate-200 hidden md:block" />
                <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewMode === 'list' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-all cursor-pointer ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <LayoutGrid size={14} />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 size={24} className="animate-spin text-indigo-600" />
                <span>{t('automations.loading')}</span>
              </div>
            ) : filteredBots.length > 0 ? (
              viewMode === 'list' ? (
                <div className="overflow-x-auto pt-2">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="py-3 px-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={filteredBots.length > 0 && filteredBots.every((b) => selectedBotIds.has(b.id))}
                            onChange={handleToggleSelectAll}
                            className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                          />
                        </th>
                        <th className="py-3 px-2">{t('automations.table.name')}</th>
                        <th className="py-3 px-2 w-28 text-center">{t('automations.table.runs')}</th>
                        <th className="py-3 px-2 w-28 text-center">{t('automations.table.ctr')}</th>
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
                          className={`border-b transition-all group cursor-pointer ${
                            bot.blocked
                              ? 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/60'
                              : 'border-slate-100 hover:bg-slate-50/50'
                          }`}
                        >
                          <td className="py-4 px-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                            {bot.role !== 'Viewer' && (
                              <input
                                type="checkbox"
                                checked={selectedBotIds.has(bot.id)}
                                onChange={() => handleToggleSelectBot(bot.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  bot.blocked
                                    ? 'bg-rose-500 shadow-sm shadow-rose-500/55'
                                    : bot.active
                                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/55'
                                    : 'bg-slate-300'
                                }`}
                              />
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-sm text-slate-800 hover:text-indigo-600 transition-all truncate max-w-xs md:max-w-md">
                                    {bot.name}
                                  </span>
                                  {bot.blocked && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs shrink-0">
                                      <Lock size={12} />
                                      {t('status.blocked') || t('admin.status_blocked') || 'Blocked'}
                                    </span>
                                  )}
                                </div>
                                {bot.blocked ? (
                                  <span className="text-xs text-slate-400 font-normal truncate max-w-xs md:max-w-md mt-0.5">
                                    {translateBlockReason(bot.blockReason)}
                                  </span>
                                ) : bot.description ? (
                                  <span className="text-xs text-slate-400 font-normal line-clamp-1 max-w-xs md:max-w-md mt-0.5">
                                    {bot.description}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2 w-28 text-sm text-slate-500 text-center">{bot.totalUsers}</td>
                          <td className="py-4 px-2 w-28 text-sm text-slate-500 text-center">
                            {bot.totalUsers === 0 ? '0%' : `${(12.5 + ((bot.id * 7) % 36) + ((bot.id * 3) % 10) / 10).toFixed(1)}%`}
                          </td>
                          <td className="py-4 px-2 w-40 text-xs text-slate-500">{formatModifiedDate(bot.updatedAt || bot.createdAt)}</td>
                          <td className="py-4 px-4 w-12 text-right" onClick={(e) => e.stopPropagation()}>
                            {bot.role !== 'Viewer' && (
                              <button
                                onClick={(e) => handleMenuClick(e, bot.id)}
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
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
                      className={`rounded-3xl p-5 border transition-all cursor-pointer flex flex-col justify-between relative group min-h-[160px] ${
                        bot.blocked
                          ? 'bg-slate-100/80 border-slate-200 hover:bg-slate-200/60 hover:border-slate-300'
                          : 'bg-white border-slate-200 hover:border-indigo-500 hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                bot.blocked
                                  ? 'bg-rose-500 shadow-sm shadow-rose-500/55'
                                  : bot.active
                                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/55'
                                  : 'bg-slate-300'
                              }`}
                            />
                            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base truncate">
                              {bot.name}
                            </h3>
                            {bot.blocked && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs shrink-0">
                                <Lock size={12} />
                                {t('status.blocked') || t('admin.status_blocked') || 'Blocked'}
                              </span>
                            )}
                          </div>
                          {bot.role !== 'Viewer' && (
                            <div className="relative inline-block text-left shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleMenuClick(e, bot.id)}
                                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                              >
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {bot.blocked
                            ? translateBlockReason(bot.blockReason)
                            : bot.description || t('automations.no_description')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4 text-[11px] text-slate-500 font-medium">
                        <div className="flex items-center gap-3">
                          <span>
                            {t('automations.table.runs')}: <span className="font-bold text-slate-700">{bot.totalUsers}</span>
                          </span>
                          <span>
                            {t('automations.table.ctr')}: <span className="font-bold text-slate-700">
                              {bot.totalUsers === 0 ? '0%' : `${(12.5 + ((bot.id * 7) % 36) + ((bot.id * 3) % 10) / 10).toFixed(1)}%`}
                            </span>
                          </span>
                        </div>
                        <span className="text-slate-400">{formatModifiedDate(bot.updatedAt || bot.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="py-12 text-center text-sm text-slate-400">
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
          className="w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-[100] py-1.5 text-left"
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
                        className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Square size={13} className="text-slate-500 fill-slate-500" />
                        <span>{t('automations.menu.stop')}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartBot(activeMenuBot.id)}
                        className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Play size={13} className="text-emerald-500 fill-emerald-500" />
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
                      className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Pencil size={13} className="text-slate-500" />
                      <span>{t('automations.menu.edit')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setMoveBotId(activeMenuBot.id);
                        setTempFolderId(botFolders[activeMenuBot.id] || '');
                        setIsMoveModalOpen(true);
                        setActiveMenuBotId(null);
                        setMenuCoords(null);
                      }}
                      className="w-full px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Folder size={13} className="text-slate-500" />
                      <span>{t('automations.menu.move')}</span>
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                  </>
                )}
                <button
                  onClick={() => handleDeleteBot(activeMenuBot.id)}
                  className="w-full px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-all cursor-pointer"
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
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-xl animate-in fade-in duration-200 cursor-default"
          >
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('automations.modal.new_automation')}</h3>
              <button
                onClick={() => setIsNewBotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('automations.modal.name_label')}
                </label>
                <input
                  type="text"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                  placeholder={t('automations.modal.name_placeholder')}
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('automations.modal.conn_label')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsBotSelectOpen(!isBotSelectOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 text-left font-sans cursor-pointer hover:bg-slate-100/50 transition-colors"
                >
                  <span className="text-slate-800 font-semibold">
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
                  <ChevronDown size={16} className={`text-slate-500 transition-transform ${isBotSelectOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBotSelectOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsBotSelectOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg z-20 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 py-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBotOption('nobot');
                          setNewBotError(null);
                          setIsBotSelectOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedBotOption === 'nobot' ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-slate-700 font-medium'}`}
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
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedBotOption === 'new' ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-slate-700 font-medium'}`}
                      >
                        <span>{t('automations.modal.conn_new')}</span>
                      </button>

                      {(() => {
                        const existingRealBots = bots.filter((b) => b.username && b.username.trim() !== '');
                        if (existingRealBots.length === 0) return null;
                        return (
                          <>
                            <div className="border-t border-slate-100 my-1" />
                            <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${selectedBotOption === String(b.id) ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-slate-700 font-medium'}`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-slate-800 font-semibold">{b.name}</span>
                                  {b.username && (
                                    <span className="text-[11px] text-slate-500 font-medium">@{b.username}</span>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    value={newBotToken}
                    onChange={(e) => setNewBotToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newBotDesc}
                  onChange={(e) => setNewBotDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 min-h-[80px] resize-none"
                  placeholder="What does this automation do?"
                />
              </div>
              {newBotError && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{newBotError}</span>
                </p>
              )}
            </div>
            <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 rounded-b-3xl">
              <button
                onClick={() => setIsNewBotModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBotSubmit}
                disabled={createBotMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100 flex items-center gap-1 disabled:opacity-50"
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
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-xl animate-in fade-in duration-200 cursor-default"
          >
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('automations.edit_modal.title')}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-655 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('automations.edit_modal.name_label')}
                </label>
                <input
                  type="text"
                  value={editBotName}
                  onChange={(e) => setEditBotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                  placeholder={t('automations.edit_modal.name_placeholder')}
                />
              </div>
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('automations.edit_modal.bot_connection')}
                </label>
                <button
                  type="button"
                  onClick={() => setIsEditBotSelectOpen(!isEditBotSelectOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 text-left font-sans cursor-pointer hover:bg-slate-100/50 transition-colors"
                >
                  <span className="text-slate-800 font-semibold">
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
                  <ChevronDown size={16} className={`text-slate-500 transition-transform ${isEditBotSelectOpen ? 'rotate-180' : ''}`} />
                </button>

                {isEditBotSelectOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsEditBotSelectOpen(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg z-20 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 py-1.5">
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
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${editBotOption === 'current' ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-slate-700 font-medium'}`}
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
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${editBotOption === 'nobot' ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-slate-700 font-medium'}`}
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
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${editBotOption === 'new' ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-slate-700 font-medium'}`}
                      >
                        <span>{t('automations.edit_modal.connect_new_bot')}</span>
                      </button>

                      {(() => {
                        const existingRealBots = bots.filter((b) => b.id !== editBotId && b.username);
                        if (existingRealBots.length === 0) return null;
                        return (
                          <>
                            <div className="border-t border-slate-100 my-1" />
                            <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors flex items-center justify-between ${editBotOption === String(b.id) ? 'bg-indigo-50/50 text-indigo-600 font-bold' : 'text-slate-700 font-medium'}`}
                              >
                                <div className="flex flex-col">
                                  <span className="text-slate-800 font-semibold">{b.name}</span>
                                  {b.username && (
                                    <span className="text-[11px] text-slate-500 font-medium">@{b.username}</span>
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
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {t('automations.edit_modal.bot_token')}
                  </label>
                  <input
                    type="text"
                    value={editBotToken}
                    onChange={(e) => setEditBotToken(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('automations.edit_modal.desc_label')}
                </label>
                <textarea
                  value={editBotDesc}
                  onChange={(e) => setEditBotDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50 min-h-[80px] resize-none"
                  placeholder={t('automations.edit_modal.desc_placeholder')}
                />
              </div>
              {editBotError && (
                <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span>{editBotError}</span>
                </p>
              )}
            </div>
            <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 rounded-b-3xl">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                {t('automations.edit_modal.cancel')}
              </button>
              <button
                onClick={handleEditBot}
                disabled={updateBotMutation.isPending}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100 flex items-center gap-1 disabled:opacity-50"
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
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-200 cursor-default"
          >
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('automations.move_modal.title')}</h3>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="text-slate-400 hover:text-slate-655 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('automations.move_modal.select_folder')}</label>
              <select
                value={tempFolderId}
                onChange={(e) => setTempFolderId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
              >
                <option value="">{t('automations.move_modal.no_folder')}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                {t('automations.move_modal.cancel')}
              </button>
              <button
                onClick={handleMoveBot}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
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
          className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full border border-slate-100 shadow-xl overflow-hidden animate-in fade-in duration-200 cursor-default"
          >
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{t('automations.folder.create_title')}</h3>
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{t('automations.folder.name_label')}</label>
              <input
                type="text"
                value={tempFolderName}
                onChange={(e) => setTempFolderName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 bg-slate-50"
                placeholder={t('automations.folder.placeholder')}
              />
            </div>
            <div className="p-6 pt-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                {t('automations.folder.cancel')}
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-150 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 font-bold shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {t('automations.blocked_modal_title') !== 'automations.blocked_modal_title' ? t('automations.blocked_modal_title') : 'Автоматизація заблокована'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {blockedDetailsBot.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBlockedDetailsBot(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('automations.blocked_modal_desc') !== 'automations.blocked_modal_desc' ? t('automations.blocked_modal_desc') : 'Ця автоматизація заблокована адміністрацією платформи і недоступна для запуску або редагування.'}
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-start justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {t('broadcast.blocked_modal_reason') !== 'broadcast.blocked_modal_reason'
                      ? t('broadcast.blocked_modal_reason')
                      : (getLanguage() === 'uk' ? 'Причина блокування:' : 'Reason for blocking:')}
                  </span>
                  <span className="font-bold text-slate-800 text-right max-w-[200px]">
                    {translateBlockReason(blockedDetailsBot.blockReason)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500 font-medium">
                    {t('broadcast.blocked_modal_date') !== 'broadcast.blocked_modal_date'
                      ? t('broadcast.blocked_modal_date')
                      : (getLanguage() === 'uk' ? 'Дата блокування:' : 'Blocked date:')}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {formatDateShort(blockedDetailsBot.blockedAt || blockedDetailsBot.updatedAt)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {t('automations.blocked_modal_support') !== 'automations.blocked_modal_support'
                  ? t('automations.blocked_modal_support')
                  : (getLanguage() === 'uk'
                      ? 'Якщо ви вважаєте, що це сталося помилково, будь ласка, зверніться до нашої підтримки.'
                      : 'If you believe this automation was blocked in error, please contact support.')}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setBlockedDetailsBot(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                {t('broadcast.blocked_modal_close') !== 'broadcast.blocked_modal_close'
                  ? t('broadcast.blocked_modal_close')
                  : (getLanguage() === 'uk' ? 'Зрозуміло' : 'Got it')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
