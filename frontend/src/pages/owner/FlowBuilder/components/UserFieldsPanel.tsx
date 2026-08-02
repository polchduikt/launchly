import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, HelpCircle, X, Folder, ChevronRight, Edit2 } from 'lucide-react';
import { useBotStore } from '../../../../store/useBotStore';
import { useBotsQuery } from '../../../../hooks/bot/useBotsQuery';
import { t } from '../../../../i18n/config';
import type { UserField, UserFieldFolder } from '../../../../types/bot';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../../../api/bot';
import { customFieldSchema, automationFolderSchema } from '../../../../schemas';

export const UserFieldsPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: bots = [] } = useBotsQuery();
  const botId = activeBotId || (bots[0]?.id || 0);

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
    if (botId > 0) {
      getCustomFieldsApi(botId)
        .then((data) => {
          if (data && typeof data === 'object') {
            if (Array.isArray(data.fields)) setFields(data.fields);
            else if (Array.isArray(data)) setFields(data);
            else setFields([]);
            if (Array.isArray(data.archivedFields)) setArchivedFields(data.archivedFields);
            if (Array.isArray(data.folders)) setFolders(data.folders);
          } else {
            setFields([]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch custom fields:', err);
        });
    }
  }, [botId]);

  const saveFieldsData = (updatedFields: UserField[], updatedArchived: UserField[], updatedFolders: UserFieldFolder[]) => {
    setFields(updatedFields);
    setArchivedFields(updatedArchived);
    setFolders(updatedFolders);
    if (botId > 0) {
      saveCustomFieldsApi(botId, {
        fields: updatedFields,
        archivedFields: updatedArchived,
        folders: updatedFolders,
      }).catch((err) => console.error('Failed to save custom fields:', err));
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

    const validation = customFieldSchema.safeParse(newField);
    if (!validation.success) return;

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

    const folderValidation = automationFolderSchema.safeParse(newFolder);
    if (!folderValidation.success) return;

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
          onMouseDown={() => {
            setActiveMenuField(null);
            setActiveMenuFolder(null);
            setActiveMenuArchivedField(null);
          }}
        />
      )}

      <div className="flex justify-between items-center select-none">
        <div className="relative w-64 text-left">
          <input
            type="text"
            placeholder={t('settings.fields.search_placeholder')}
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
                  {t('settings.fields.user_fields_tab')}
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
              <span className="font-['Anybody',sans-serif] text-[#0A0A0A] font-black text-sm uppercase">{t('settings.fields.user_fields_tab')}</span>
            )}
          </div>

          <button
            onClick={() => setIsFieldModalOpen(true)}
            className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Plus size={14} />
            <span>{t('settings.fields.new_field_btn')}</span>
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
                    <div className="absolute right-3 top-11 z-[100] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_0px_#0A0A0A] py-1 w-28 text-left animate-in fade-in duration-100">
                      <button
                        onClick={() => {
                          setActiveFolderId(folder.id);
                          setRenameFolderName(folder.name);
                          setIsRenameFolderOpen(true);
                          setActiveMenuFolder(null);
                        }}
                        className="w-full px-3 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold text-left cursor-pointer uppercase"
                      >
                        {t('settings.fields.action_rename')}
                      </button>
                      <button
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer border-t-2 border-[#0A0A0A]/15 uppercase"
                      >
                        {t('settings.fields.action_delete')}
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
                <span>{t('settings.fields.new_folder_btn')}</span>
              </button>
            </div>
          )}

          <div className="border-2 border-[#0A0A0A] rounded-2xl bg-white overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                  <th className="px-5 py-3 w-10 rounded-tl-[14px]">
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 accent-[#0A0A0A] cursor-not-allowed"
                    />
                  </th>
                  <th className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span>{t('settings.fields.table_name')}</span>
                      <HelpCircle size={12} />
                    </div>
                  </th>
                  <th className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span>{t('settings.fields.table_type')}</span>
                      <HelpCircle size={12} />
                    </div>
                  </th>
                  <th className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <span>{t('settings.fields.table_desc')}</span>
                      <HelpCircle size={12} />
                    </div>
                  </th>
                  <th className="px-5 py-3 w-12 text-right rounded-tr-[14px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
                {filteredFields.map((field, index) => {
                  const isLastItems = filteredFields.length <= 2 || index >= filteredFields.length - 2;
                  const isLastRow = index === filteredFields.length - 1;
                  return (
                    <tr key={field.name} className={`hover:bg-[#F2EBDD]/50 bg-white ${activeMenuField === field.name ? 'relative z-50' : ''}`}>
                      <td className={`px-5 py-3.5 ${isLastRow ? 'rounded-bl-[14px]' : ''}`}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#0A0A0A]">
                        {field.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {field.type}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {field.description || '-'}
                      </td>
                      <td className={`px-5 py-3.5 text-right relative overflow-visible ${isLastRow ? 'rounded-br-[14px]' : ''}`}>
                        <button
                          onClick={() => setActiveMenuField(activeMenuField === field.name ? null : field.name)}
                          className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[#0A0A0A] cursor-pointer transition-all"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuField === field.name && (
                          <div
                            className={`absolute right-5 z-[100] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_0px_#0A0A0A] py-1 w-32 text-left animate-in fade-in duration-100 ${isLastItems ? 'bottom-8' : 'top-10'}`}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <button
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleArchiveField(field.name);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold text-left cursor-pointer uppercase select-none"
                            >
                              {t('settings.fields.action_archive')}
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteField(field.name, false);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer border-t-2 border-[#0A0A0A]/15 uppercase select-none"
                            >
                              {t('settings.fields.action_delete')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredFields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-700 italic bg-white font-bold rounded-b-[14px]">
                      {t('settings.fields.empty_state')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl text-left overflow-visible">
        <div className="p-5 border-b-2 border-[#0A0A0A]">
          <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">
            {t('settings.fields.archived_header')}
          </h3>
        </div>
        <div className="p-5">
          <div className="border-2 border-[#0A0A0A] rounded-2xl bg-white overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F2EBDD] border-b-2 border-[#0A0A0A] text-xs font-black text-[#0A0A0A] uppercase tracking-wider select-none">
                  <th className="px-5 py-3 w-10 rounded-tl-[14px]">
                    <input
                      type="checkbox"
                      disabled
                      className="w-4 h-4 accent-[#0A0A0A] cursor-not-allowed"
                    />
                  </th>
                  <th className="px-5 py-3">{t('settings.fields.table_name')}</th>
                  <th className="px-5 py-3">{t('settings.fields.table_type')}</th>
                  <th className="px-5 py-3">{t('settings.fields.table_desc')}</th>
                  <th className="px-5 py-3 w-12 text-right rounded-tr-[14px]"></th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#0A0A0A]/15 text-xs font-bold text-[#0A0A0A]">
                {filteredArchived.map((field, index) => {
                  const isLastItems = filteredArchived.length <= 2 || index >= filteredArchived.length - 2;
                  const isLastRow = index === filteredArchived.length - 1;
                  return (
                    <tr key={field.name} className={`hover:bg-[#F2EBDD]/50 bg-white ${activeMenuArchivedField === field.name ? 'relative z-50' : ''}`}>
                      <td className={`px-5 py-3.5 ${isLastRow ? 'rounded-bl-[14px]' : ''}`}>
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
                        />
                      </td>
                      <td className="px-5 py-3.5 font-bold text-[#0A0A0A]">
                        {field.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {field.type}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700">
                        {field.description || '-'}
                      </td>
                      <td className={`px-5 py-3.5 text-right relative overflow-visible ${isLastRow ? 'rounded-br-[14px]' : ''}`}>
                        <button
                          onClick={() => setActiveMenuArchivedField(activeMenuArchivedField === field.name ? null : field.name)}
                          className="p-1 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-lg text-[#0A0A0A] cursor-pointer transition-all"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuArchivedField === field.name && (
                          <div
                            className={`absolute right-5 z-[100] bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl shadow-[4px_4px_0px_0px_#0A0A0A] py-1 w-32 text-left animate-in fade-in duration-100 ${isLastItems ? 'bottom-8' : 'top-10'}`}
                            onMouseDown={(e) => e.stopPropagation()}
                          >
                            <button
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleUnarchiveField(field.name);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-bold text-left cursor-pointer uppercase select-none"
                            >
                              Unarchive
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteField(field.name, true);
                              }}
                              className="w-full px-3 py-1.5 hover:bg-rose-600 hover:text-white text-rose-800 text-xs font-bold text-left cursor-pointer border-t-2 border-[#0A0A0A]/15 uppercase select-none"
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
                    <td colSpan={5} className="text-center py-10 text-slate-700 italic bg-white font-bold rounded-b-[14px]">
                      {t('settings.fields.empty_state')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isFieldModalOpen && (
        <div 
          onClick={() => setIsFieldModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <form 
            onSubmit={handleCreateField}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 select-none">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.fields.create_field_title')}
              </h3>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1 hover:bg-white rounded-lg text-[#0A0A0A] transition-all cursor-pointer border-2 border-transparent hover:border-[#0A0A0A]"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                  {t('settings.fields.name_label')}
                </label>
                <input
                  type="text"
                  required
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder={t('settings.fields.placeholder_field_name')}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                  {t('settings.fields.type_label')}
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] cursor-pointer focus:outline-none"
                >
                  <option value="Text">{t('settings.fields.type_text')}</option>
                  <option value="Number">{t('settings.fields.type_number')}</option>
                  <option value="Date">{t('settings.fields.type_date')}</option>
                  <option value="Boolean">{t('settings.fields.type_boolean')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
                  {t('settings.fields.desc_label')}
                </label>
                <input
                  type="text"
                  value={newFieldDesc}
                  onChange={(e) => setNewFieldDesc(e.target.value)}
                  placeholder={t('settings.fields.placeholder_desc')}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.fields.btn_cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.fields.btn_create_field')}
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
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 select-none">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.fields.create_folder_title')}
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
                {t('settings.fields.folder_name_label')}
              </label>
              <input
                type="text"
                required
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t('settings.fields.placeholder_folder_name')}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsFolderModalOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.fields.btn_cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.fields.btn_create_folder')}
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
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl p-6 shadow-[8px_8px_0px_0px_#0A0A0A] w-full max-w-sm flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left cursor-default"
          >
            <div className="flex items-center justify-between border-b-2 border-[#0A0A0A] pb-3 select-none">
              <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase tracking-wide">
                {t('settings.fields.rename_folder_title')}
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
                {t('settings.fields.folder_name_label')}
              </label>
              <input
                type="text"
                required
                value={renameFolderName}
                onChange={(e) => setRenameFolderName(e.target.value)}
                placeholder={t('settings.fields.placeholder_folder_name')}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-[#0A0A0A] text-xs font-bold bg-white text-[#0A0A0A] focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t-2 border-[#0A0A0A]/15 select-none">
              <button
                type="button"
                onClick={() => setIsRenameFolderOpen(false)}
                className="px-4 py-2.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] text-[#0A0A0A] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.fields.btn_cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-[#F2EBDD] text-xs font-black uppercase rounded-xl border-2 border-[#0A0A0A] transition-all cursor-pointer"
              >
                {t('settings.fields.btn_save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
