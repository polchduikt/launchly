import { useState, useEffect, useCallback } from 'react';
import type { UserField, UserFieldFolder } from '../../types/bot';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../api/bot';
import { customFieldSchema, automationFolderSchema } from '../../schemas';
import { generateId } from '../../utils/id';

interface UseCustomFieldsDataParams {
  bots?: Array<{ id: number }>;
  botId?: number;
}

export const useCustomFieldsData = ({ bots = [], botId = 0 }: UseCustomFieldsDataParams = {}) => {
  const [fields, setFields] = useState<UserField[]>([]);
  const [archivedFields, setArchivedFields] = useState<UserField[]>([]);
  const [folders, setFolders] = useState<UserFieldFolder[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const botIds = (bots || []).map((b) => b.id).join(',');

  useEffect(() => {
    const idList = botIds ? botIds.split(',').map(Number) : [];
    if (idList.length > 0) {
      setIsLoading(true);
      Promise.all(idList.map((id) => getCustomFieldsApi(id).catch(() => null)))
        .then((results) => {
          const mergedFieldsMap = new Map<string, UserField>();
          const mergedArchivedMap = new Map<string, UserField>();
          const mergedFoldersMap = new Map<string, UserFieldFolder>();

          results.forEach((data) => {
            if (!data || typeof data !== 'object') return;
            const fieldList = Array.isArray(data.fields) ? data.fields : Array.isArray(data) ? data : [];
            fieldList.forEach((rawField: unknown) => {
              const rf = rawField as Partial<UserField> | string | undefined;
              const f: UserField = typeof rf === 'string'
                ? { name: rf, type: 'Text' }
                : {
                    id: rf?.id,
                    name: rf?.name || '',
                    type: rf?.type || 'Text',
                    value: rf?.value,
                    description: rf?.description,
                    folderId: rf?.folderId,
                    folder: rf?.folder,
                  };
              if (f && f.name) {
                const key = f.name.trim().toLowerCase();
                if (!mergedFieldsMap.has(key)) {
                  mergedFieldsMap.set(key, f);
                }
              }
            });

            if (Array.isArray(data.archivedFields)) {
              data.archivedFields.forEach((rawAf: unknown) => {
                const afObj = rawAf as Partial<UserField> | string | undefined;
                const af: UserField = typeof afObj === 'string'
                  ? { name: afObj, type: 'Text' }
                  : {
                      id: afObj?.id,
                      name: afObj?.name || '',
                      type: afObj?.type || 'Text',
                      value: afObj?.value,
                      description: afObj?.description,
                      folderId: afObj?.folderId,
                      folder: afObj?.folder,
                    };
                if (af && af.name) {
                  const key = af.name.trim().toLowerCase();
                  if (!mergedArchivedMap.has(key)) {
                    mergedArchivedMap.set(key, af);
                  }
                }
              });
            }

            if (Array.isArray(data.folders)) {
              data.folders.forEach((rawFld: unknown) => {
                const fldObj = rawFld as Partial<UserFieldFolder> | undefined;
                const fld: UserFieldFolder = {
                  id: String(fldObj?.id ?? ''),
                  name: fldObj?.name || '',
                  fieldsCount: fldObj?.fieldsCount,
                };
                if (fld && fld.name) {
                  const key = fld.name.trim().toLowerCase();
                  if (!mergedFoldersMap.has(key)) {
                    mergedFoldersMap.set(key, fld);
                  }
                }
              });
            }
          });

          setFields(Array.from(mergedFieldsMap.values()));
          setArchivedFields(Array.from(mergedArchivedMap.values()));
          setFolders(Array.from(mergedFoldersMap.values()));
        })
        .catch((err) => {
          console.error('Failed to fetch custom fields:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (botId > 0) {
      setIsLoading(true);
      getCustomFieldsApi(botId)
        .then((data) => {
          if (data && typeof data === 'object') {
            const rawFields = Array.isArray(data.fields) ? data.fields : Array.isArray(data) ? data : [];
            setFields(
              rawFields.map((f: unknown) =>
                typeof f === 'string' ? { name: f, type: 'Text' } : (f as UserField)
              )
            );
            if (Array.isArray(data.archivedFields)) {
              setArchivedFields(
                data.archivedFields.map((af: unknown) =>
                  typeof af === 'string' ? { name: af, type: 'Text' } : (af as UserField)
                )
              );
            }
            if (Array.isArray(data.folders)) {
              setFolders(
                data.folders.map((fld: unknown) => {
                  const fldObj = fld as Partial<UserFieldFolder> | undefined;
                  return {
                    id: String(fldObj?.id ?? ''),
                    name: fldObj?.name || '',
                    fieldsCount: fldObj?.fieldsCount,
                  };
                })
              );
            }
          } else {
            setFields([]);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch custom fields:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [botIds, botId]);

  const saveFieldsData = useCallback(
    (updatedFields: UserField[], updatedArchived: UserField[], updatedFolders: UserFieldFolder[]) => {
      setFields(updatedFields);
      setArchivedFields(updatedArchived);
      setFolders(updatedFolders);
      const payload = {
        fields: updatedFields,
        archivedFields: updatedArchived,
        folders: updatedFolders,
      };
      const idList = botIds ? botIds.split(',').map(Number) : [];
      if (idList.length > 0) {
        idList.forEach((id) => {
          saveCustomFieldsApi(id, payload).catch((err) =>
            console.error('Failed to save custom fields:', err)
          );
        });
      } else if (botId > 0) {
        saveCustomFieldsApi(botId, payload).catch((err) =>
          console.error('Failed to save custom fields:', err)
        );
      }
    },
    [botIds, botId]
  );

  const createField = useCallback(
    (fieldData: Omit<UserField, 'folder'> & { folder?: string | null }) => {
      const validation = customFieldSchema.safeParse(fieldData);
      if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || 'Invalid field' };
      }

      const newField: UserField = {
        name: fieldData.name.trim(),
        type: fieldData.type || 'Text',
        value: fieldData.value?.trim(),
        description: fieldData.description?.trim(),
        folder: fieldData.folder ?? null,
      };

      const updated = [...fields.filter((f) => f.name !== newField.name), newField];
      saveFieldsData(updated, archivedFields, folders);
      return { success: true };
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  const editField = useCallback(
    (originalName: string, fieldData: UserField) => {
      const validation = customFieldSchema.safeParse(fieldData);
      if (!validation.success) {
        return { success: false, error: validation.error.issues[0]?.message || 'Invalid field' };
      }

      const updated = fields.map((f) => (f.name === originalName ? fieldData : f));
      saveFieldsData(updated, archivedFields, folders);
      return { success: true };
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  const createFolder = useCallback(
    (name: string) => {
      const newFolder: UserFieldFolder = {
        id: generateId('folder'),
        name: name.trim(),
      };

      const folderValidation = automationFolderSchema.safeParse(newFolder);
      if (!folderValidation.success) {
        return { success: false, error: folderValidation.error.issues[0]?.message || 'Invalid folder' };
      }

      const updatedFolders = [...folders, newFolder];
      saveFieldsData(fields, archivedFields, updatedFolders);
      return { success: true };
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  const renameFolder = useCallback(
    (folderId: string, newName: string) => {
      if (!newName.trim()) return;
      const updatedFolders = folders.map((f) =>
        f.id === folderId ? { ...f, name: newName.trim() } : f
      );
      saveFieldsData(fields, archivedFields, updatedFolders);
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  const deleteFolder = useCallback(
    (folderId: string) => {
      const updatedFolders = folders.filter((f) => f.id !== folderId);
      const updatedFields = fields.map((f) => (f.folder === folderId ? { ...f, folder: null } : f));
      saveFieldsData(updatedFields, archivedFields, updatedFolders);
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  const archiveField = useCallback(
    (name: string) => {
      const target = fields.find((f) => f.name === name);
      if (!target) return;

      const updatedFields = fields.filter((f) => f.name !== name);
      const updatedArchived = [
        ...archivedFields.filter((f) => f.name !== name),
        { ...target, folder: null },
      ];
      saveFieldsData(updatedFields, updatedArchived, folders);
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  const unarchiveField = useCallback(
    (name: string, targetFolderId: string | null) => {
      const target = archivedFields.find((f) => f.name === name);
      if (!target) return;

      const updatedArchived = archivedFields.filter((f) => f.name !== name);
      const updatedFields = [
        ...fields.filter((f) => f.name !== name),
        { ...target, folder: targetFolderId },
      ];
      saveFieldsData(updatedFields, updatedArchived, folders);
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  const deleteField = useCallback(
    (name: string, isArchived: boolean) => {
      if (isArchived) {
        const updated = archivedFields.filter((f) => f.name !== name);
        saveFieldsData(fields, updated, folders);
      } else {
        const updated = fields.filter((f) => f.name !== name);
        saveFieldsData(updated, archivedFields, folders);
      }
    },
    [fields, archivedFields, folders, saveFieldsData]
  );

  return {
    fields,
    archivedFields,
    folders,
    isLoading,
    saveFieldsData,
    createField,
    editField,
    createFolder,
    renameFolder,
    deleteFolder,
    archiveField,
    unarchiveField,
    deleteField,
  };
};
