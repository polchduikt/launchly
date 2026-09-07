import React, { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { ActionItem, ActionNodeEditorProps } from '../../../../../../types/bot';
import { t } from '../../../../../../i18n/config';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useTagsQuery, useCreateTagMutation } from '../../../../../../hooks/broadcast/useBroadcastQueries';
import { useIntegrationsQuery } from '../../../../../../hooks/integration/useIntegrationQueries';
import { useCustomFieldsQuery, useSaveCustomFieldsMutation } from '../../../../../../hooks/bot/useCustomFieldsQuery';
import { GoogleSheetsConfigModal } from './GoogleSheetsConfigModal';
import {
  ActionItemRow,
  ActionPickerModal,
  CreateTagModal,
  CreateFieldModal,
  useGoogleSheetsActions,
} from './action';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

export const ActionNodeEditor: React.FC<ActionNodeEditorProps> = React.memo(({ data, handleChange, editorState }) => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);
  const createTagMutation = useCreateTagMutation(activeBotId || 0);
  const { data: integrations = [] } = useIntegrationsQuery();

  const { data: customFieldsData } = useCustomFieldsQuery(activeBotId);
  const saveCustomFieldsMutation = useSaveCustomFieldsMutation(activeBotId);
  const [userFields, setUserFields] = useState<Array<{ name: string; type: string; description: string }>>([]);

  useEffect(() => {
    if (customFieldsData && typeof customFieldsData === 'object') {
      const list = Array.isArray(customFieldsData.fields)
        ? customFieldsData.fields
        : Array.isArray(customFieldsData)
          ? customFieldsData
          : [];
      setUserFields(
        list.map((f: { name?: string; type?: string; description?: string } | string) => ({
          name: typeof f === 'string' ? f : f?.name || '',
          type: typeof f === 'string' ? 'Text' : f?.type || 'Text',
          description: typeof f === 'string' ? '' : f?.description || '',
        })).filter((f: { name: string }) => Boolean(f.name))
      );
    }
  }, [customFieldsData]);

  const customFields = useMemo(() => {
    return userFields.map(f => f.name);
  }, [userFields]);

  const isGoogleSheetsConnected = integrations.some(
    (i) => i.type === 'GOOGLE_SHEETS' && i.active
  );

  const actions = (data.actions || []) as ActionItem[];

  const [isActionPickerOpen, setIsActionPickerOpen] = useState(false);
  const [activePopoverIndex, setActivePopoverIndex] = useState<number | null>(null);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [currentActionIndexForTag, setCurrentActionIndexForTag] = useState<number | null>(null);

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [currentActionIndexForField, setCurrentActionIndexForField] = useState<number | null>(null);

  const updateActions = (newActions: ActionItem[]) => {
    handleChange('actions', newActions);
  };

  const handleModifyAction = (index: number, fields: Partial<ActionItem>) => {
    const updated = actions.map((act, i) => {
      if (i === index) {
        return { ...act, ...fields };
      }
      return act;
    });
    updateActions(updated);
  };

  const sheetsConfig = useGoogleSheetsActions({
    activeBotId,
    actions,
    onModifyAction: handleModifyAction,
  });

  const handleAddAction = (type: string) => {
    const newAction: ActionItem = { type };
    if (type === 'GS_INSERT_ROW' || type === 'GS_GET_ROW' || type === 'GS_UPDATE_ROW') {
      newAction.spreadsheetId = '';
      newAction.sheetName = 'Sheet1';
      newAction.columnMappings = [];
    } else if (type === 'SET_USER_FIELD' || type === 'CLEAR_USER_FIELD') {
      newAction.fieldName = '';
      newAction.fieldValue = '';
    } else if (type === 'ADD_TAG' || type === 'REMOVE_TAG') {
      newAction.tagId = '';
      newAction.tagName = '';
    }

    updateActions([...actions, newAction]);
  };

  const handleRemoveAction = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    updateActions(actions.filter((_, i) => i !== index));
  };

  const handleMoveActionUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...actions];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updateActions(updated);
  };

  const handleMoveActionDown = (index: number) => {
    if (index >= actions.length - 1) return;
    const updated = [...actions];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updateActions(updated);
  };

  const handleCreateTag = async (name: string, folder: string) => {
    let formattedName = name;
    if (folder) {
      formattedName = `${folder}/${name}`;
    }

    try {
      const createdTag = await createTagMutation.mutateAsync({ name: formattedName });
      if (currentActionIndexForTag !== null) {
        handleModifyAction(currentActionIndexForTag, {
          tagId: String(createdTag.id),
          tagName: createdTag.name,
        });
      }
      setIsTagModalOpen(false);
      setCurrentActionIndexForTag(null);
    } catch (err) {
      console.error('Failed to create tag', err);
    }
  };

  const handleCreateField = (newField: { name: string; type: string; description: string; folder?: string }) => {
    if (!activeBotId) return;

    const updated = [...userFields.filter((f) => f.name !== newField.name), newField];
    setUserFields(updated);
    saveCustomFieldsMutation.mutate({ fields: updated });

    if (currentActionIndexForField !== null) {
      handleModifyAction(currentActionIndexForField, {
        fieldName: newField.name,
      });
    }

    setIsFieldModalOpen(false);
    setCurrentActionIndexForField(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          {t('node.action.perform_actions')}
        </label>
      </div>

      <div className="space-y-4">
        {actions.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 font-semibold select-none italic bg-slate-50/30">
            {t('editor.action.no_actions')}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {actions.map((act, index) => (
              <ActionItemRow
                key={index}
                action={act}
                index={index}
                totalActions={actions.length}
                tags={tags}
                userFields={userFields}
                activePopoverIndex={activePopoverIndex}
                setActivePopoverIndex={setActivePopoverIndex}
                onMoveUp={handleMoveActionUp}
                onMoveDown={handleMoveActionDown}
                onRemove={handleRemoveAction}
                onModify={handleModifyAction}
                onOpenTagModal={(idx) => {
                  setCurrentActionIndexForTag(idx);
                  setIsTagModalOpen(true);
                }}
                onOpenFieldModal={(idx) => {
                  setCurrentActionIndexForField(idx);
                  setIsFieldModalOpen(true);
                }}
                onOpenSheetsModal={sheetsConfig.handleOpenSheetsConfigModal}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 mt-3">
        <button
          onClick={() => setIsActionPickerOpen(true)}
          className="w-full py-2.5 border border-dashed border-[#EED796] hover:border-[#ffb200] hover:bg-amber-50/30 text-[#ffb200] hover:text-[#ff9f00] text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
        >
          <Plus size={14} />
          <span>{t('editor.action.add_action')}</span>
        </button>

        {!!editorState && (
          <button
            onClick={() => (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true)}
            className="w-full py-2.5 border border-[#407BFF] hover:bg-blue-50/10 text-[#407BFF] hover:text-[#2d6ae5] text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
          >
            <span>{t('editor.action.choose_next_step')}</span>
          </button>
        )}
      </div>

      <ActionPickerModal
        isOpen={isActionPickerOpen}
        onClose={() => setIsActionPickerOpen(false)}
        onSelectAction={handleAddAction}
      />

      <GoogleSheetsConfigModal
        isOpen={sheetsConfig.isSheetsModalOpen}
        onClose={() => sheetsConfig.setIsSheetsModalOpen(false)}
        sheetsAction={sheetsConfig.sheetsAction!}
        isGoogleSheetsConnected={isGoogleSheetsConnected}
        isLoadingSpreadsheets={sheetsConfig.isLoadingSpreadsheets}
        spreadsheets={sheetsConfig.spreadsheets}
        spreadsheetsError={sheetsConfig.spreadsheetsError}
        isLoadingWorksheets={sheetsConfig.isLoadingWorksheets}
        worksheets={sheetsConfig.worksheets}
        worksheetsError={sheetsConfig.worksheetsError}
        isLoadingHeaders={sheetsConfig.isLoadingHeaders}
        headers={sheetsConfig.headers}
        tags={tags}
        customFields={customFields}
        handleSpreadsheetChange={sheetsConfig.handleSpreadsheetChange}
        handleWorksheetChange={sheetsConfig.handleWorksheetChange}
        handleRefreshHeaders={sheetsConfig.handleRefreshHeaders}
        handleMappingValueChange={sheetsConfig.handleMappingValueChange}
        handleSaveSheetsConfig={sheetsConfig.handleSaveSheetsConfig}
        handleReconnectGoogleSheets={sheetsConfig.handleReconnectGoogleSheets}
        handleLookupColumnChange={sheetsConfig.handleLookupColumnChange}
        handleLookupValueChange={sheetsConfig.handleLookupValueChange}
      />

      <CreateTagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onCreateTag={handleCreateTag}
        isPending={createTagMutation.isPending}
      />

      <CreateFieldModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        onCreateField={handleCreateField}
      />
    </div>
  );
});
