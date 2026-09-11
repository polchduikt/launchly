import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useBotStore } from '../../../../store/useBotStore';
import { useBotsQuery } from '../../../../hooks/bot/useBotsQuery';
import { useCustomFieldsData } from '../../../../hooks/bot/useCustomFieldsData';
import { t } from '../../../../i18n/config';
import type { UserField, UserFieldFolder } from '../../../../types/bot';
import { automationFolderSchema } from '../../../../schemas';
import { generateId } from '../../../../utils/id';
import { FieldModal, FolderModal, FolderToolbar, FieldsTable } from './userFields';

export const UserFieldsPanel: React.FC = () => {
  const activeBotId = useBotStore((state) => state?.activeBotId);
  const { data: bots = [] } = useBotsQuery();
  const botId = activeBotId || (bots[0]?.id || 0);

  const { fields, archivedFields, folders, saveFieldsData } = useCustomFieldsData({ bots, botId });

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<UserField | null>(null);

  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<UserFieldFolder | null>(null);

  const handleSaveField = (fieldData: UserField) => {
    if (editingField) {
      const updated = fields.map((f) => (f.name === editingField.name ? fieldData : f));
      saveFieldsData(updated, archivedFields, folders);
      setEditingField(null);
    } else {
      const updated = [...fields.filter((f) => f.name !== fieldData.name), fieldData];
      saveFieldsData(updated, archivedFields, folders);
      setIsFieldModalOpen(false);
    }
  };

  const handleCreateFolder = (name: string) => {
    const newFolder: UserFieldFolder = {
      id: generateId('folder'),
      name: name.trim(),
    };

    const folderValidation = automationFolderSchema.safeParse(newFolder);
    if (!folderValidation.success) return;

    const updatedFolders = [...folders, newFolder];
    saveFieldsData(fields, archivedFields, updatedFolders);
    setIsFolderModalOpen(false);
  };

  const handleRenameFolder = (name: string) => {
    if (!renamingFolder) return;
    const updatedFolders = folders.map((f) =>
      f.id === renamingFolder.id ? { ...f, name: name.trim() } : f
    );
    saveFieldsData(fields, archivedFields, updatedFolders);
    setRenamingFolder(null);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    const updatedFields = fields.map((f) => (f.folder === folderId ? { ...f, folder: null } : f));
    saveFieldsData(updatedFields, archivedFields, updatedFolders);
  };

  const handleArchiveField = (name: string) => {
    const target = fields.find((f) => f.name === name);
    if (!target) return;

    const updatedFields = fields.filter((f) => f.name !== name);
    const updatedArchived = [...archivedFields.filter((f) => f.name !== name), { ...target, folder: null }];
    saveFieldsData(updatedFields, updatedArchived, folders);
  };

  const handleUnarchiveField = (name: string) => {
    const target = archivedFields.find((f) => f.name === name);
    if (!target) return;

    const updatedArchived = archivedFields.filter((f) => f.name !== name);
    const updatedFields = [...fields.filter((f) => f.name !== name), { ...target, folder: activeFolderId }];
    saveFieldsData(updatedFields, updatedArchived, folders);
  };

  const handleDeleteField = (name: string, isArchived: boolean) => {
    if (isArchived) {
      const updated = archivedFields.filter((f) => f.name !== name);
      saveFieldsData(fields, updated, folders);
    } else {
      const updated = fields.filter((f) => f.name !== name);
      saveFieldsData(updated, archivedFields, folders);
    }
  };

  const filteredFields = fields.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isFolderField = Boolean(f.folder && folders.some((fld) => fld.id === f.folder));
    const matchesFolder = activeFolderId
      ? f.folder === activeFolderId
      : !isFolderField;
    return matchesSearch && matchesFolder && !f.name.toLowerCase().includes('cooldown');
  });

  const filteredArchived = archivedFields.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !f.name.toLowerCase().includes('cooldown')
  );

  return (
    <div className="space-y-6 relative">
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

      <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl text-left overflow-visible shadow-sm">
        <FolderToolbar
          folders={folders}
          activeFolderId={activeFolderId}
          onSelectFolder={setActiveFolderId}
          onOpenNewFieldModal={() => setIsFieldModalOpen(true)}
          onOpenNewFolderModal={() => setIsFolderModalOpen(true)}
          onStartRenameFolder={(folder) => setRenamingFolder(folder)}
          onDeleteFolder={handleDeleteFolder}
        />

        <div className="p-5">
          <FieldsTable
            fields={filteredFields}
            isArchived={false}
            onEdit={(field) => setEditingField(field)}
            onArchive={handleArchiveField}
            onDelete={handleDeleteField}
          />
        </div>
      </div>

      <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl text-left overflow-visible shadow-sm">
        <div className="p-5 border-b-2 border-[#0A0A0A]">
          <h3 className="font-['Anybody',sans-serif] text-sm font-black text-[#0A0A0A] uppercase">
            {t('settings.fields.archived_header')}
          </h3>
        </div>
        <div className="p-5">
          <FieldsTable
            fields={filteredArchived}
            isArchived={true}
            onUnarchive={handleUnarchiveField}
            onDelete={handleDeleteField}
          />
        </div>
      </div>

      <FieldModal
        isOpen={isFieldModalOpen || editingField !== null}
        initialField={editingField}
        activeFolderId={activeFolderId}
        onClose={() => {
          setIsFieldModalOpen(false);
          setEditingField(null);
        }}
        onSave={handleSaveField}
      />

      <FolderModal
        isOpen={isFolderModalOpen}
        title={t('settings.fields.create_folder_title')}
        submitLabel={t('settings.fields.btn_create_folder')}
        onClose={() => setIsFolderModalOpen(false)}
        onSave={handleCreateFolder}
      />

      <FolderModal
        isOpen={renamingFolder !== null}
        title={t('settings.fields.rename_folder_title')}
        submitLabel={t('settings.fields.btn_save')}
        initialName={renamingFolder?.name || ''}
        onClose={() => setRenamingFolder(null)}
        onSave={handleRenameFolder}
      />
    </div>
  );
};
