import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, X, Folder, ChevronRight, Edit2 } from 'lucide-react';
import { useBotStore } from '../../../store/useBotStore';
import { useTagsQuery, useCreateTagMutation, useDeleteTagMutation } from '../../broadcast/hooks/useBroadcastQueries';

interface TagFolder {
  id: string;
  name: string;
}

export const TagsSettingsPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [], refetch: refetchTags } = useTagsQuery(activeBotId || 0);
  const createTagMutation = useCreateTagMutation(activeBotId || 0);
  const deleteTagMutation = useDeleteTagMutation(activeBotId || 0);

  const [folders, setFolders] = useState<TagFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [tagFolderMap, setTagFolderMap] = useState<Record<number, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');

  const [activeMenuTag, setActiveMenuTag] = useState<number | null>(null);
  const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);

  useEffect(() => {
    if (activeBotId !== null && activeBotId !== undefined) {
      const storedFolders = localStorage.getItem(`launchly_tag_folders_${activeBotId}`);
      if (storedFolders) {
        try {
          setFolders(JSON.parse(storedFolders));
        } catch {
          setFolders([]);
        }
      } else {
        setFolders([]);
      }

      const storedMap = localStorage.getItem(`launchly_tag_folder_map_${activeBotId}`);
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
  }, [activeBotId]);

  const saveFoldersData = (updatedFolders: TagFolder[], updatedMap: Record<number, string>) => {
    setFolders(updatedFolders);
    setTagFolderMap(updatedMap);
    if (activeBotId !== null && activeBotId !== undefined) {
      localStorage.setItem(`launchly_tag_folders_${activeBotId}`, JSON.stringify(updatedFolders));
      localStorage.setItem(`launchly_tag_folder_map_${activeBotId}`, JSON.stringify(updatedMap));
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !activeBotId) return;

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

  const handleDeleteTag = async (tagId: number) => {
    if (!activeBotId) return;
    try {
      await deleteTagMutation.mutateAsync(tagId);
      setActiveMenuTag(null);
      
      const updatedMap = { ...tagFolderMap };
      delete updatedMap[tagId];
      saveFoldersData(folders, updatedMap);

      refetchTags();
    } catch (err) {
      console.error('Failed to delete tag', err);
    }
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  const filteredTags = tags.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const belongsToActiveFolder = (tagFolderMap[t.id] || null) === (activeFolderId || null);
    return matchesSearch && belongsToActiveFolder;
  });

  return (
    <div className="space-y-6 relative">
      {(activeMenuTag !== null || activeMenuFolder !== null) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setActiveMenuTag(null);
            setActiveMenuFolder(null);
          }}
        />
      )}

      <div className="flex justify-between items-center select-none">
        <div className="relative w-64 text-left">
          <input
            type="text"
            placeholder="Search by Tag name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 focus:outline-none focus:border-blue-500 rounded-xl text-xs font-semibold bg-white"
          />
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm text-left">
        <div className="p-5 flex justify-between items-center border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold select-none">
            {activeFolderId && activeFolder ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveFolderId(null)}
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  Tags
                </button>
                <ChevronRight size={14} className="text-slate-350" />
                <div className="flex items-center gap-1">
                  <span className="text-slate-800">{activeFolder.name}</span>
                  <button
                    onClick={() => {
                      setRenameFolderName(activeFolder.name);
                      setIsRenameFolderOpen(true);
                    }}
                    className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-all"
                  >
                    <Edit2 size={11} />
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-slate-800 font-extrabold text-sm">Tags</span>
            )}
          </div>

          <button
            onClick={() => setIsTagModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Plus size={14} />
            <span>New Tag</span>
          </button>
        </div>

        <div className="p-5">
          {!activeFolderId && (
            <div className="flex flex-wrap gap-4 mb-5">
              {folders.map((folder) => (
                <div
                  key={folder.id}
                  className="flex items-center justify-between border border-slate-200 rounded-xl px-4 py-2.5 bg-white w-48 shadow-sm hover:border-slate-300 transition-all relative"
                >
                  <button
                    onClick={() => setActiveFolderId(folder.id)}
                    className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                  >
                    <Folder size={16} className="text-blue-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate w-28">{folder.name}</span>
                  </button>
                  <button
                    onClick={() => setActiveMenuFolder(activeMenuFolder === folder.id ? null : folder.id)}
                    className="p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <MoreVertical size={14} />
                  </button>

                  {activeMenuFolder === folder.id && (
                    <div className="absolute right-3 top-11 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-24 text-left animate-in fade-in slide-in-from-top-1 duration-100">
                      <button
                        onClick={() => {
                          setActiveFolderId(folder.id);
                          setRenameFolderName(folder.name);
                          setIsRenameFolderOpen(true);
                          setActiveMenuFolder(null);
                        }}
                        className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-bold text-left cursor-pointer"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-655 text-xs font-bold text-left cursor-pointer border-t border-slate-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="px-4 py-2.5 border border-dashed border-blue-200 text-blue-655 hover:bg-blue-50/10 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer select-none"
              >
                <Plus size={14} />
                <span>New Folder</span>
              </button>
            </div>
          )}

          <div className="border border-slate-100 rounded-2xl bg-white overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/30 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider select-none">
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-not-allowed"
                    />
                  </th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
                {filteredTags.map((tag, index) => {
                  const isLastItems = index >= filteredTags.length - 2 && filteredTags.length > 2;
                  return (
                    <tr key={tag.id} className="hover:bg-slate-55/20 bg-white">
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {tag.name}
                      </td>
                      <td className="px-5 py-3.5 text-right relative overflow-visible">
                        <button
                          onClick={() => setActiveMenuTag(activeMenuTag === tag.id ? null : tag.id)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuTag === tag.id && (
                          <div className={`absolute right-5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-24 text-left animate-in fade-in duration-100 ${isLastItems ? 'bottom-8' : 'top-10'}`}>
                            <button
                              onClick={() => handleDeleteTag(tag.id)}
                              className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-xs font-bold text-left cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredTags.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-10 text-slate-450 italic bg-white select-none">
                      No Tags
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isTagModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateTag} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Create Tag
              </h3>
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                required
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold bg-slate-50/20"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100 select-none">
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTagName.trim() || createTagMutation.isPending}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer shadow-blue-100 disabled:opacity-50"
              >
                {createTagMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateFolder} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Create Folder
              </h3>
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Folder Name
              </label>
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold bg-slate-50/20"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100 select-none">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer shadow-blue-100"
              >
                Create Folder
              </button>
            </div>
          </form>
        </div>
      )}

      {isRenameFolderOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleRenameFolder} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Rename Folder
              </h3>
              <button
                type="button"
                onClick={() => setIsRenameFolderOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                Folder Name
              </label>
              <input
                type="text"
                required
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                placeholder="Enter folder name"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold bg-slate-50/20"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100 select-none">
              <button
                type="button"
                onClick={() => setIsRenameFolderOpen(false)}
                className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer shadow-blue-100"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
