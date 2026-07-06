import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, HelpCircle, X, Folder, ChevronRight, Edit2 } from 'lucide-react';
import { useBotStore } from '../../../store/useBotStore';

interface UserField {
  name: string;
  type: string;
  description: string;
  folder?: string | null;
}

interface UserFieldFolder {
  id: string;
  name: string;
}

export const UserFieldsPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const [fields, setFields] = useState<UserField[]>([]);
  const [archivedFields, setArchivedFields] = useState<UserField[]>([]);
  const [folders, setFolders] = useState<UserFieldFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');
  const [newFieldDesc, setNewFieldDesc] = useState('');

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [isRenameFolderOpen, setIsRenameFolderOpen] = useState(false);
  const [renameFolderName, setRenameFolderName] = useState('');

  const [activeMenuField, setActiveMenuField] = useState<string | null>(null);
  const [activeMenuFolder, setActiveMenuFolder] = useState<string | null>(null);
  const [activeMenuArchivedField, setActiveMenuArchivedField] = useState<string | null>(null);

  useEffect(() => {
    if (activeBotId !== null && activeBotId !== undefined) {
      const storedFields = localStorage.getItem(`launchly_custom_fields_${activeBotId}`);
      if (storedFields) {
        try {
          setFields(JSON.parse(storedFields));
        } catch {
          setFields([]);
        }
      } else {
        const defaults = [
          { name: 'Kr', type: 'Text', description: 'User credit count', folder: null },
          { name: 'Рыба', type: 'Text', description: 'Favorite fish type', folder: null }
        ];
        setFields(defaults);
        localStorage.setItem(`launchly_custom_fields_${activeBotId}`, JSON.stringify(defaults));
      }

      const storedArchived = localStorage.getItem(`launchly_archived_fields_${activeBotId}`);
      if (storedArchived) {
        try {
          setArchivedFields(JSON.parse(storedArchived));
        } catch {
          setArchivedFields([]);
        }
      } else {
        setArchivedFields([]);
      }

      const storedFolders = localStorage.getItem(`launchly_field_folders_${activeBotId}`);
      if (storedFolders) {
        try {
          setFolders(JSON.parse(storedFolders));
        } catch {
          setFolders([]);
        }
      } else {
        setFolders([]);
      }
    }
  }, [activeBotId]);

  const saveFieldsData = (updatedFields: UserField[], updatedArchived: UserField[], updatedFolders: UserFieldFolder[]) => {
    setFields(updatedFields);
    setArchivedFields(updatedArchived);
    setFolders(updatedFolders);
    if (activeBotId !== null && activeBotId !== undefined) {
      localStorage.setItem(`launchly_custom_fields_${activeBotId}`, JSON.stringify(updatedFields));
      localStorage.setItem(`launchly_archived_fields_${activeBotId}`, JSON.stringify(updatedArchived));
      localStorage.setItem(`launchly_field_folders_${activeBotId}`, JSON.stringify(updatedFolders));
    }
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const newField: UserField = {
      name: newFieldName.trim(),
      type: newFieldType,
      description: newFieldDesc.trim(),
      folder: activeFolderId
    };

    const updated = [...fields.filter(f => f.name !== newField.name), newField];
    saveFieldsData(updated, archivedFields, folders);
    setIsFieldModalOpen(false);
    setNewFieldName('');
    setNewFieldDesc('');
    setNewFieldType('Text');
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: UserFieldFolder = {
      id: Math.random().toString(36).substring(7),
      name: newFolderName.trim()
    };

    const updatedFolders = [...folders, newFolder];
    saveFieldsData(fields, archivedFields, updatedFolders);
    setIsFolderModalOpen(false);
    setNewFolderName('');
  };

  const handleRenameFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameFolderName.trim() || !activeFolderId) return;

    const updatedFolders = folders.map(f => f.id === activeFolderId ? { ...f, name: renameFolderName.trim() } : f);
    saveFieldsData(fields, archivedFields, updatedFolders);
    setIsRenameFolderOpen(false);
    setRenameFolderName('');
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter(f => f.id !== folderId);
    const updatedFields = fields.map(f => f.folder === folderId ? { ...f, folder: null } : f);
    saveFieldsData(updatedFields, archivedFields, updatedFolders);
    setActiveMenuFolder(null);
  };

  const handleArchiveField = (name: string) => {
    const target = fields.find(f => f.name === name);
    if (!target) return;

    const updatedFields = fields.filter(f => f.name !== name);
    const updatedArchived = [...archivedFields.filter(f => f.name !== name), { ...target, folder: null }];
    saveFieldsData(updatedFields, updatedArchived, folders);
    setActiveMenuField(null);
  };

  const handleUnarchiveField = (name: string) => {
    const target = archivedFields.find(f => f.name === name);
    if (!target) return;

    const updatedArchived = archivedFields.filter(f => f.name !== name);
    const updatedFields = [...fields.filter(f => f.name !== name), { ...target, folder: activeFolderId }];
    saveFieldsData(updatedFields, updatedArchived, folders);
    setActiveMenuArchivedField(null);
  };

  const handleDeleteField = (name: string, isArchived: boolean) => {
    if (isArchived) {
      const updated = archivedFields.filter(f => f.name !== name);
      saveFieldsData(fields, updated, folders);
      setActiveMenuArchivedField(null);
    } else {
      const updated = fields.filter(f => f.name !== name);
      saveFieldsData(updated, archivedFields, folders);
      setActiveMenuField(null);
    }
  };

  const activeFolder = folders.find(f => f.id === activeFolderId);

  const filteredFields = fields.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = (f.folder || null) === (activeFolderId || null);
    return matchesSearch && matchesFolder;
  });

  const filteredArchived = archivedFields.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      {(activeMenuField || activeMenuFolder || activeMenuArchivedField) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setActiveMenuField(null);
            setActiveMenuFolder(null);
            setActiveMenuArchivedField(null);
          }}
        />
      )}

      <div className="flex justify-between items-center select-none">
        <div className="flex border-b border-slate-200">
          <button className="px-4 py-2 text-xs font-bold border-b-2 border-blue-600 text-slate-800 cursor-pointer">
            User Fields
          </button>
          <button className="px-4 py-2 text-xs font-bold border-b-2 border-transparent text-slate-400 hover:text-slate-650 cursor-pointer">
            Bot Fields
          </button>
        </div>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search by User Field name"
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
                  User Fields
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
              <span className="text-slate-800 font-extrabold text-sm">User Fields</span>
            )}
          </div>

          <button
            onClick={() => setIsFieldModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Plus size={14} />
            <span>New User Field</span>
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
                className="px-4 py-2.5 border border-dashed border-blue-200 text-blue-650 hover:bg-blue-50/10 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer select-none"
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
                  <th className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span>Name</span>
                      <HelpCircle size={12} />
                    </div>
                  </th>
                  <th className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span>Type</span>
                      <HelpCircle size={12} />
                    </div>
                  </th>
                  <th className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span>Description</span>
                      <HelpCircle size={12} />
                    </div>
                  </th>
                  <th className="px-5 py-3 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredFields.map((field, index) => {
                  const isLastItems = index >= filteredFields.length - 2 && filteredFields.length > 2;
                  return (
                    <tr key={field.name} className="hover:bg-slate-55/20 bg-white">
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {field.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-550">
                        {field.type}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {field.description || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right relative overflow-visible">
                        <button
                          onClick={() => setActiveMenuField(activeMenuField === field.name ? null : field.name)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuField === field.name && (
                          <div className={`absolute right-5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-32 text-left animate-in fade-in duration-100 ${isLastItems ? 'bottom-8' : 'top-10'}`}>
                            <button
                              onClick={() => handleArchiveField(field.name)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-bold text-left cursor-pointer"
                            >
                              Archive
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.name, false)}
                              className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-600 text-xs font-bold text-left cursor-pointer border-t border-slate-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredFields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-450 italic bg-white">
                      No Fields
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[20px] shadow-sm text-left">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-800">
            Archived User Fields
          </h3>
        </div>
        <div className="p-5">
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
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3 w-12 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredArchived.map((field, index) => {
                  const isLastItems = index >= filteredArchived.length - 2 && filteredArchived.length > 2;
                  return (
                    <tr key={field.name} className="hover:bg-slate-55/20 bg-white">
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-slate-350 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        {field.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-550">
                        {field.type}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">
                        {field.description || '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right relative overflow-visible">
                        <button
                          onClick={() => setActiveMenuArchivedField(activeMenuArchivedField === field.name ? null : field.name)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer transition-all"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuArchivedField === field.name && (
                          <div className={`absolute right-5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-32 text-left animate-in fade-in duration-100 ${isLastItems ? 'bottom-8' : 'top-10'}`}>
                            <button
                              onClick={() => handleUnarchiveField(field.name)}
                              className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 text-xs font-bold text-left cursor-pointer"
                            >
                              Unarchive
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.name, true)}
                              className="w-full px-3 py-1.5 hover:bg-rose-50 text-rose-605 text-xs font-bold text-left cursor-pointer border-t border-slate-50"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredArchived.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-450 italic bg-white">
                      No Fields
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isFieldModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <form onSubmit={handleCreateField} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Create User Field
              </h3>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="Enter field name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Type
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold bg-white cursor-pointer"
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Date">Date</option>
                  <option value="Boolean">Boolean</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newFieldDesc}
                  onChange={(e) => setNewFieldDesc(e.target.value)}
                  placeholder="Enter description"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-100 select-none">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-4 py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer shadow-blue-100"
              >
                Create Field
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
