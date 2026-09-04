import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../../../i18n/config';
import { Search, Plus, MoreVertical, X, Folder, ChevronRight, Edit2 } from 'lucide-react';
import { useBotStore } from '../../../../store/useBotStore';
import { useBotsQuery } from '../../../../hooks/bot/useBotsQuery';
import { useAllTagsQuery, useCreateTagMutation } from '../../../../hooks/broadcast/useBroadcastQueries';
import { deleteTagApi } from '../../../../api/broadcast';
import type { TagResponse } from '../../../../types/broadcast';
import { useQueryClient } from '@tanstack/react-query';
import type { TagFolder } from '../../../../types/bot';

export const TagsSettingsPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();
  const botId = activeBotId || (bots[0]?.id || 0);

  const { data: tags = [], refetch: refetchTags } = useAllTagsQuery();
  const createTagMutation = useCreateTagMutation(botId);

  const [folders, setFolders] = useState<TagFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [tagFolderMap, setTagFolderMap] = useState<Record<number, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuTag, setActiveMenuTag] = useState<number | string | null>(null);
  const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveMenuTag(null);
      setActiveMenuFolder(null);
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');

  useEffect(() => {
    if (botId > 0) {
      const storedFolders = localStorage.getItem(`launchly_tag_folders_${botId}`);
      if (storedFolders) {
        try {
          setFolders(JSON.parse(storedFolders));
        } catch {
          setFolders([]);
        }
      } else {
        setFolders([]);
      }

      const storedMap = localStorage.getItem(`launchly_tag_folder_map_${botId}`);
      if (storedMap) {
        try {
          setTagFolderMap(JSON.parse(storedMap));
        } catch {
          setTagFolderMap({});
        }
      } else {
        setTagFolderMap({});
      }
    }
  }, [botId]);

  const saveFoldersData = (updatedFolders: TagFolder[], updatedMap: Record<number, string>) => {
    setFolders(updatedFolders);
    setTagFolderMap(updatedMap);
    if (botId > 0) {
      localStorage.setItem(`launchly_tag_folders_${botId}`, JSON.stringify(updatedFolders));
      localStorage.setItem(`launchly_tag_folder_map_${botId}`, JSON.stringify(updatedMap));
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !botId) return;

    try {
      const result = await createTagMutation.mutateAsync({ name: newTagName.trim() });
      setIsTagModalOpen(false);
      setNewTagName('');
      
      if (result && result.id && activeFolderId) {
        const updatedMap = { ...tagFolderMap, [result.id]: activeFolderId };
        saveFoldersData(folders, updatedMap);
      }
      refetchTags();
    } catch (err) {
      console.error('Failed to create tag', err);
    }
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: TagFolder = {
      id: Math.random().toString(36).substring(7),
      name: newFolderName.trim()
    };

    const updatedFolders = [...folders, newFolder];
    saveFoldersData(updatedFolders, tagFolderMap);
    setIsFolderModalOpen(false);
    setNewFolderName('');
  };

  const handleRenameFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderName.trim() || !activeFolderId) return;

    const updatedFolders = folders.map(f => f.id === activeFolderId ? { ...f, name: renameFolderName.trim() } : f);
    saveFoldersData(updatedFolders, tagFolderMap);
    setIsRenameFolderOpen(false);
    setRenameFolderName('');
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter(f => f.id !== folderId);
    const updatedMap = { ...tagFolderMap };
    Object.keys(updatedMap).forEach(key => {
      if (updatedMap[Number(key)] === folderId) {
        delete updatedMap[Number(key)];
      }
    });
    saveFoldersData(updatedFolders, updatedMap);
    setActiveMenuFolder(null);
  };

  const handleDeleteTag = async (tag: TagResponse) => {
    const targetBotId = tag.botId || botId;
    setActiveMenuTag(null);
    if (!tag.id) return;
    try {
      if (targetBotId) {
        await deleteTagApi(targetBotId, Number(tag.id));
      }
    } catch (err) {
      console.error('Failed to delete tag', err);
    } finally {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      refetchTags();
    }
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  const filteredTags = tags.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const belongsToActiveFolder = ((tagFolderMap as any)[t.id] || null) === (activeFolderId || null);
    return matchesSearch && belongsToActiveFolder;
  });

  return (
    <div className="space-y-6 relative font-['JetBrains_Mono',monospace]">
      {(activeMenuTag !== null || activeMenuFolder !== null) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onMouseDown={() => {
            setActiveMenuTag(null);
            setActiveMenuFolder(null);
          }}
        />
      )}

      <div className="flex justify-between items-center">
        <div className="relative w-64 text-left">
          <input
            type="text"
            placeholder={t('settings.tags.search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border-2 border-[#0A0A0A] focus:outline-none rounded-xl text-xs font-bold bg-white text-[#0A0A0A]"
          />
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]" />
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl text-left overflow-visible">
        <div className="p-5 flex justify-between items-center border-b-2 border-[#0A0A0A]">
          <div className="flex items-center gap-1.5 text-xs font-bold select-none">
            {activeFolderId && activeFolder ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveFolderId(null)}
                  className="text-slate-600 hover:text-[#0A0A0A] transition-colors cursor-pointer uppercase"
                >
                  {t('settings.tags.title')}
                </button>
                <ChevronRight size={14} className="text-[#0A0A0A]" />
                <div className="flex items-center gap-1">
                  <span className="text-[#0A0A0A] font-black">{activeFolder.name}</span>
                  <button
                    onClick={() => {
                      setRenameFolderName(activeFolder.name);
                      setIsRenameFolderOpen(true);
                    }}
                    className="p-1 hover:bg-white text-[#0A0A0A] rounded-lg cursor-pointer transition-all border-2 border-transparent hover:border-[#0A0A0A]"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>
              </div>
            ) : (
              <span className="font-['Anybody',sans-serif] text-[#0A0A0A] font-black text-sm uppercase">{t('settings.tags.title')}</span>
            )}
          </div>

          <button
            onClick={() => setIsTagModalOpen(true)}
            className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Plus size={14} />
            <span>{t('settings.tags.new_tag_btn', 'Новий тег')}</span>
          </button>
        </div>

        <div className="p-5">
          {!activeFolderId && (
            <div className="flex flex-wrap gap-4 mb-5">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between border-2 border-[#0A0A0A] rounded-xl px-4 py-2.5 bg-white w-48 hover:bg-[#F2EBDD] transition-all relative"
                >
                  <button
                    onClick={() => setActiveFolderId(folder.id)}
                    className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                  >
                    <Folder size={16} className="text-[#0A0A0A] shrink-0" />
                    <span className="text-xs font-bold text-[#0A0A0A] truncate w-28">{folder.name}</span>
                  </button>
                  <button
                    onClick={() => setActiveMenuFolder(activeMenuFolder === folder.id ? null : folder.id)}
                    className="p-0.5 hover:bg-[#0A0A0A] rounded text-[#0A0A0A] hover:text-[#F2EBDD] cursor-pointer"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeMenuFolder === folder.id && (
                    <div className="absolute right-3 top-11 z-[100] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-xl py-1 w-28 text-left animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          setActiveFolderId(folder.id);
                          setRenameFolderName(folder.name);
                          setIsRenameFolderOpen(true);
                          setActiveMenuFolder(null);
                        }}
                        className="w-full px-3 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold text-left cursor-pointer uppercase"
                      >
                        {t('settings.tags.action_rename', 'Перейменувати')}
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer border-t-2 border-[#0A0A0A]/15 uppercase"
                      >
                        {t('settings.tags.action_delete', 'Видалити')}
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="px-4 py-2.5 border-2 border-dashed border-[#0A0A0A] text-[#0A0A0A] hover:bg-white text-xs font-black uppercase rounded-xl transition-all flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Plus size={14} />
                <span>{t('settings.tags.new_folder_btn', 'Нова папка')}</span>
              </button>
            </div>
          )}

          <div className="border-2 border-[#0A0A0A] rounded-2xl bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 accent-[#0A0A0A] cursor-not-allowed"
                    />
                  </th>
                  <th className="px-5 py-3">{t('settings.tags.table_name')}</th>
                  <th className="px-5 py-3 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-[#F2EBDD]/50 bg-white">
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3.5 font-bold text-[#0A0A0A]">
                      {tag.name}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                          setActiveMenuTag(activeMenuTag === tag.id ? null : tag.id);
                        }}
                        className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[#0A0A0A] cursor-pointer transition-all"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTags.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-slate-700 italic bg-white font-bold select-none">
                      {t('settings.tags.empty_state')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {activeMenuTag && menuCoords && createPortal(
        <div
          style={{ top: menuCoords.top, right: menuCoords.right }}
          className="fixed z-[9999] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-xl py-1 w-28 text-left animate-in fade-in duration-100 font-['JetBrains_Mono',monospace]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const tag = filteredTags.find((t) => t.id === activeMenuTag);
              if (tag) handleDeleteTag(tag);
              setActiveMenuTag(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer uppercase select-none transition-colors"
          >
            {t('settings.tags.action_delete')}
          </button>
        </div>,
        document.body
      )}

      {isTagModalOpen && (
        <div 
          onClick={() => setIsTagModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <form 
            onSubmit={handleCreateTag}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 select-none">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.tags.create_tag_title')}
              </h3>
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                {t('settings.tags.table_name')}
              </label>
              <input
                type="text"
                required
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder={t('settings.tags.placeholder_tag_name')}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.tags.btn_cancel')}
              </button>
              <button
                type="submit"
                disabled={!newTagName.trim() || createTagMutation.isPending}
                className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer disabled:opacity-50"
              >
                {createTagMutation.isPending ? 'Creating...' : t('settings.tags.btn_create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {isFolderModalOpen && (
        <div 
          onClick={() => setIsFolderModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <form 
            onSubmit={handleCreateFolder}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 select-none">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.tags.create_folder_title')}
              </h3>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                {t('settings.tags.new_folder_btn')}
              </label>
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t('settings.tags.placeholder_folder_name')}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.tags.btn_cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.tags.btn_create_folder')}
              </button>
            </div>
          </form>
        </div>
      )}

      {isRenameFolderOpen && (
        <div 
          onClick={() => setIsRenameFolderOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <form 
            onSubmit={handleRenameFolder}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 select-none">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.tags.rename_folder_title')}
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameFolderOpen(false)}
                className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                {t('settings.tags.new_folder_btn')}
              </label>
              <input
                type="text"
                required
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                placeholder={t('settings.tags.placeholder_folder_name')}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsRenameFolderOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.tags.btn_cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.tags.btn_save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
