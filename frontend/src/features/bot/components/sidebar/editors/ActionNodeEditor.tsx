import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import type { ActionItem, ActionNodeEditorProps } from '../../../../../types/bot';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}
import { useBotStore } from '../../../../../store/useBotStore';
import { useAuthStore } from '../../../../../store/useAuthStore';
import { useTagsQuery, useCreateTagMutation } from '../../../../broadcast/hooks/useBroadcastQueries';
import { useIntegrationsQuery } from '../../../../integration/hooks/useIntegrationQueries';
import { TagSearchSelect } from './TagSearchSelect';
import { SetUserFieldPopover } from './SetUserFieldPopover';
import { GoogleSheetsConfigModal } from './GoogleSheetsConfigModal';
import {
  Plus,
  Trash2,
  ChevronDown,
  Tag,
  User,
  CheckSquare,
  FileSpreadsheet,
  X,
  MessageSquare,
  Search,
  ArrowUp,
  ArrowDown
} from 'lucide-react';


export const ActionNodeEditor: React.FC<ActionNodeEditorProps> = ({ data, handleChange, editorState }) => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);
  const createTagMutation = useCreateTagMutation(activeBotId || 0);
  const { data: integrations = [] } = useIntegrationsQuery();

  const [userFields, setUserFields] = useState<Array<{ name: string; type: string; description: string }>>([]);

  const [prevBotId, setPrevBotId] = useState<number | null>(null);
  if (activeBotId !== prevBotId) {
    setPrevBotId(activeBotId);
    let loaded = [
      { name: 'Kr', type: 'Text', description: 'User credit count' },
      { name: 'Рыба', type: 'Text', description: 'Favorite fish type' }
    ];
    if (activeBotId) {
      const stored = localStorage.getItem(`launchly_custom_fields_${activeBotId}`);
      if (stored) {
        try {
          loaded = JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored user fields', e);
        }
      } else {
        localStorage.setItem(`launchly_custom_fields_${activeBotId}`, JSON.stringify(loaded));
      }
    }
    setUserFields(loaded);
  }

  const customFields = useMemo(() => {
    return userFields.map(f => f.name);
  }, [userFields]);

  const isGoogleSheetsConnected = integrations.some(
    (i) => i.type === 'GOOGLE_SHEETS' && i.active
  );

  const actions = (data.actions || []) as ActionItem[];
  const [expandedIndex, setExpandedIndex] = useState<number | null>(
    actions.length > 0 ? 0 : null
  );

  const [isActionPickerOpen, setIsActionPickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('recently_used');
  const [searchQuery, setSearchQuery] = useState('');

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');
  const [newFieldDesc, setNewFieldDesc] = useState('');
  const [newFieldFolder, setNewFieldFolder] = useState('User Fields');
  const [currentActionIndexForField, setCurrentActionIndexForField] = useState<number | null>(null);

  const [activePopoverIndex, setActivePopoverIndex] = useState<number | null>(null);

  const allActions = [
    { type: 'ADD_TAG', title: 'Add Tag', desc: 'Add a tag to this contact.', icon: <Tag size={18} className="text-amber-500" />, category: 'contact' },
    { type: 'REMOVE_TAG', title: 'Remove Tag', desc: 'Remove a tag from this contact.', icon: <Tag size={18} className="text-amber-500" />, category: 'contact' },
    { type: 'SET_USER_FIELD', title: 'Set Custom Field', desc: 'Set a custom field value on the contact.', icon: <User size={18} className="text-sky-500" />, category: 'contact' },
    { type: 'CLEAR_USER_FIELD', title: 'Clear Custom Field', desc: 'Clear a custom field value from the contact.', icon: <User size={18} className="text-sky-500" />, category: 'contact' },
    
    { type: 'TELEGRAM_SUBSCRIBE', title: 'Set Telegram Opt-in', desc: 'Subscribe the contact to Telegram updates.', icon: <CheckSquare size={18} className="text-indigo-500" />, category: 'automation' },
    { type: 'TELEGRAM_UNSUBSCRIBE', title: 'Unsubscribe from Telegram', desc: 'Unsubscribe the contact from Telegram updates.', icon: <CheckSquare size={18} className="text-indigo-500" />, category: 'automation' },
    
    { type: 'GS_INSERT_ROW', title: 'Insert Row', desc: 'Send Launchly data to Google Sheets.', pro: true, icon: <FileSpreadsheet size={18} className="text-emerald-500" />, category: 'sheets' },
    { type: 'GS_GET_ROW', title: 'Get Row by Value', desc: 'Return Google Sheets data to Launchly.', pro: true, icon: <FileSpreadsheet size={18} className="text-emerald-500" />, category: 'sheets' },
    { type: 'GS_UPDATE_ROW', title: 'Update Row', desc: 'Update Google Sheets with Launchly data.', pro: true, icon: <FileSpreadsheet size={18} className="text-emerald-500" />, category: 'sheets' },
    
    { type: 'MARK_DONE', title: 'Mark Conversation as Done', desc: 'Close the active conversation thread.', icon: <MessageSquare size={18} className="text-emerald-500" />, category: 'live_chat' },
    { type: 'ASSIGN_AGENT', title: 'Assign to Agent', desc: 'Assign this chat session to a live support representative.', icon: <User size={18} className="text-blue-500" />, category: 'live_chat' },
  ];

  const filteredActions = allActions.filter(
    (act) =>
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [sheetsAction, setSheetsAction] = useState<ActionItem | null>(null);

  const [spreadsheets, setSpreadsheets] = useState<{ id: string; name: string }[]>([]);
  const [worksheets, setWorksheets] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoadingSpreadsheets, setIsLoadingSpreadsheets] = useState(false);
  const [isLoadingWorksheets, setIsLoadingWorksheets] = useState(false);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  const [spreadsheetsError, setSpreadsheetsError] = useState('');
  const [worksheetsError, setWorksheetsError] = useState('');

  const resolveSpreadsheetSelection = (value: string, availableSpreadsheets: { id: string; name: string }[]) => {
    const trimmedValue = value.trim();
    const matched = availableSpreadsheets.find((sheet) =>
      sheet.id === trimmedValue || sheet.name.trim().toLowerCase() === trimmedValue.toLowerCase()
    );
    return matched?.id || value;
  };

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagFolder, setNewTagFolder] = useState('');
  const [currentActionIndexForTag, setCurrentActionIndexForTag] = useState<number | null>(null);

  const updateActions = (newActions: ActionItem[]) => {
    handleChange('actions', newActions);
  };

  const handleReconnectGoogleSheets = () => {
    if (!activeBotId) return;
    const token = useAuthStore.getState().accessToken;
    window.location.href = `/api/v1/integrations/google/auth?botId=${activeBotId}&token=${token}`;
  };

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

    const updated = [...actions, newAction];
    updateActions(updated);
    setExpandedIndex(updated.length - 1);
  };

  const handleRemoveAction = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = actions.filter((_, i) => i !== index);
    updateActions(updated);
    if (expandedIndex === index) {
      setExpandedIndex(updated.length > 0 ? 0 : null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };
  const handleMoveActionUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...actions];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    updateActions(updated);
    if (expandedIndex === index) {
      setExpandedIndex(index - 1);
    } else if (expandedIndex === index - 1) {
      setExpandedIndex(index);
    }
  };

  const handleMoveActionDown = (index: number) => {
    if (index >= actions.length - 1) return;
    const updated = [...actions];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updateActions(updated);
    if (expandedIndex === index) {
      setExpandedIndex(index + 1);
    } else if (expandedIndex === index + 1) {
      setExpandedIndex(index);
    }
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

  const fetchSpreadsheets = async () => {
    setIsLoadingSpreadsheets(true);
    setSpreadsheetsError('');
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/v1/integrations/google/spreadsheets?botId=${activeBotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setSpreadsheets(result);
        return result as { id: string; name: string }[];
      } else {
        const error = await res.json().catch(() => null);
        setSpreadsheets([]);
        const message = error?.message || 'Failed to load Google spreadsheets.';
        setSpreadsheetsError(
          message.includes('No static resource')
            ? 'Google Sheets API endpoint is not available. Restart the backend so the latest integrations routes are loaded.'
            : message
        );
      }
    } catch (e) {
      console.error('Failed to fetch spreadsheets', e);
      setSpreadsheets([]);
      setSpreadsheetsError('Failed to load Google spreadsheets.');
    } finally {
      setIsLoadingSpreadsheets(false);
    }
    return [];
  };

  const fetchWorksheets = async (spreadsheetId: string) => {
    setIsLoadingWorksheets(true);
    setWorksheetsError('');
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch(`/api/v1/integrations/google/spreadsheets/${spreadsheetId}/worksheets?botId=${activeBotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setWorksheets(result);
      } else {
        const error = await res.json().catch(() => null);
        setWorksheets([]);
        setWorksheetsError(error?.message || 'Failed to load worksheets.');
      }
    } catch (e) {
      console.error('Failed to fetch worksheets', e);
      setWorksheets([]);
      setWorksheetsError('Failed to load worksheets.');
    } finally {
      setIsLoadingWorksheets(false);
    }
  };

  const fetchHeaders = async (spreadsheetId: string, worksheetName: string) => {
    setIsLoadingHeaders(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const encodedSheet = encodeURIComponent(worksheetName);
      const res = await fetch(`/api/v1/integrations/google/spreadsheets/${spreadsheetId}/values/${encodedSheet}/headers?botId=${activeBotId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        return result as string[];
      }
    } catch (e) {
      console.error('Failed to fetch headers', e);
    } finally {
      setIsLoadingHeaders(false);
    }
    return [];
  };

  const handleOpenSheetsConfigModal = async (index: number) => {
    const action = actions[index];
    setEditingActionIndex(index);
    setSheetsAction({ ...action });
    setIsSheetsModalOpen(true);
    const loadedSpreadsheets = await fetchSpreadsheets();
    if (action.spreadsheetId) {
      const resolvedSpreadsheetId = resolveSpreadsheetSelection(action.spreadsheetId, loadedSpreadsheets);
      if (resolvedSpreadsheetId !== action.spreadsheetId) {
        setSheetsAction((prev) => prev ? { ...prev, spreadsheetId: resolvedSpreadsheetId } : null);
      }
      fetchWorksheets(resolvedSpreadsheetId);
      if (action.sheetName) {
        fetchHeaders(resolvedSpreadsheetId, action.sheetName).then((fetchedHeaders) => {
          setHeaders(fetchedHeaders);
        });
      }
    } else {
      setWorksheets([]);
      setHeaders([]);
      setWorksheetsError('');
    }
  };

  const handleSpreadsheetChange = async (spreadsheetId: string) => {
    setSheetsAction((prev) => prev ? { ...prev, spreadsheetId, sheetName: '', columnMappings: [] } : null);
    setWorksheets([]);
    setHeaders([]);
    setWorksheetsError('');
    if (spreadsheetId) {
      fetchWorksheets(spreadsheetId);
    }
  };

  const handleWorksheetChange = async (sheetName: string) => {
    setSheetsAction((prev) => prev ? { ...prev, sheetName, columnMappings: [] } : null);
    setHeaders([]);
    if (sheetsAction?.spreadsheetId && sheetName) {
      const fetchedHeaders = await fetchHeaders(sheetsAction.spreadsheetId, sheetName);
      setHeaders(fetchedHeaders);
      const defaultMappings = fetchedHeaders.map((header) => ({ column: header, value: '' }));
      setSheetsAction((prev) => prev ? { ...prev, columnMappings: defaultMappings } : null);
    }
  };

  const handleRefreshHeaders = async () => {
    if (sheetsAction?.spreadsheetId && sheetsAction.sheetName) {
      const fetchedHeaders = await fetchHeaders(sheetsAction.spreadsheetId, sheetsAction.sheetName);
      setHeaders(fetchedHeaders);
      const currentMappings = sheetsAction.columnMappings || [];
      const newMappings = fetchedHeaders.map((header) => {
        const existing = currentMappings.find((m) => m.column === header);
        return { column: header, value: existing ? existing.value : '' };
      });
      setSheetsAction((prev) => prev ? { ...prev, columnMappings: newMappings } : null);
    }
  };

  const handleMappingValueChange = (header: string, val: string) => {
    setSheetsAction((prev) => {
      if (!prev) return null;
      const currentMappings = prev.columnMappings || [];
      const index = currentMappings.findIndex((m) => m.column === header);
      const newMappings = [...currentMappings];
      if (index >= 0) {
        newMappings[index] = { ...newMappings[index], value: val };
      } else {
        newMappings.push({ column: header, value: val });
      }
      return { ...prev, columnMappings: newMappings };
    });
  };

  const handleLookupColumnChange = (lookupColumn: string) => {
    setSheetsAction((prev) => prev ? { ...prev, lookupColumn } : null);
  };

  const handleLookupValueChange = (lookupValue: string) => {
    setSheetsAction((prev) => prev ? { ...prev, lookupValue } : null);
  };

  const handleSaveSheetsConfig = () => {
    if (editingActionIndex !== null && sheetsAction) {
      handleModifyAction(editingActionIndex, sheetsAction);
      setIsSheetsModalOpen(false);
      setEditingActionIndex(null);
    }
  };



  const handleCreateFieldSubmit = () => {
    if (!newFieldName.trim() || !activeBotId) return;

    const newField = {
      name: newFieldName.trim(),
      type: newFieldType,
      description: newFieldDesc.trim()
    };

    const stored = localStorage.getItem(`launchly_custom_fields_${activeBotId}`);
    let fieldsList: Array<{ name: string; type: string; description: string }> = [];
    if (stored) {
      try {
        fieldsList = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    const updated = [...fieldsList.filter((f) => f.name !== newField.name), newField];
    localStorage.setItem(`launchly_custom_fields_${activeBotId}`, JSON.stringify(updated));

    setUserFields(updated);

    if (currentActionIndexForField !== null) {
      handleModifyAction(currentActionIndexForField, {
        fieldName: newField.name
      });
    }

    setIsFieldModalOpen(false);
    setNewFieldName('');
    setNewFieldDesc('');
    setNewFieldType('Text');
    setNewFieldFolder('User Fields');
    setCurrentActionIndexForField(null);
  };

  const handleCreateTagSubmit = async () => {
    if (!newTagName.trim()) return;

    let formattedName = newTagName.trim();
    if (newTagFolder.trim()) {
      formattedName = `${newTagFolder.trim()}/${newTagName.trim()}`;
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
      setNewTagName('');
      setNewTagFolder('');
      setCurrentActionIndexForTag(null);
    } catch (err) {
      console.error('Failed to create tag', err);
    }
  };

  const getActionName = (type: string) => {
    switch (type) {
      case 'ADD_TAG': return 'Add Tag';
      case 'REMOVE_TAG': return 'Remove Tag';
      case 'SET_USER_FIELD': return 'Set Custom Field';
      case 'CLEAR_USER_FIELD': return 'Clear Custom Field';
      case 'TELEGRAM_SUBSCRIBE': return 'Subscribe to Telegram';
      case 'TELEGRAM_UNSUBSCRIBE': return 'Unsubscribe Telegram';
      case 'GS_INSERT_ROW': return 'Google Sheets: Insert Row';
      case 'GS_GET_ROW': return 'Google Sheets: Get Row';
      case 'GS_UPDATE_ROW': return 'Google Sheets: Update Row';
            case 'MARK_DONE': return 'Mark Conversation as Done';
      case 'ASSIGN_AGENT': return 'Assign to Agent';
      default: return 'Action';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'ADD_TAG':
      case 'REMOVE_TAG':
        return <Tag size={14} className="text-amber-500" />;
      case 'SET_USER_FIELD':
      case 'CLEAR_USER_FIELD':
        return <User size={14} className="text-sky-500" />;
      case 'TELEGRAM_SUBSCRIBE':
      case 'TELEGRAM_UNSUBSCRIBE':
        return <CheckSquare size={14} className="text-indigo-500" />;
      case 'GS_INSERT_ROW':
      case 'GS_GET_ROW':
      case 'GS_UPDATE_ROW':
        return <FileSpreadsheet size={14} className="text-emerald-500" />;
                  case 'MARK_DONE':
        return <CheckSquare size={14} className="text-emerald-500" />;
      case 'ASSIGN_AGENT':
        return <User size={14} className="text-blue-500" />;
      default:
        return <Plus size={14} className="text-slate-500" />;
    }
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Perform Following Actions
        </label>
      </div>

      <div className="space-y-4">
        {actions.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 font-semibold select-none italic bg-slate-50/30">
            No actions configured. Click "+ Action" to add one.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {actions.map((act, index) => {
              return (
                <div key={index} className="flex flex-col gap-1.5 pb-3 border-b border-slate-100/70 last:border-b-0 relative group">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="shrink-0">{getActionIcon(act.type)}</span>
                      <span className="text-xs font-bold text-slate-800">
                        {getActionName(act.type)}
                      </span>
                    </div>
                    
                    
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 absolute right-0 top-0 z-10">
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMoveActionUp(index)}
                          className="p-1 text-slate-450 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <ArrowUp size={13} />
                        </button>
                      )}
                      {index < actions.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMoveActionDown(index)}
                          className="p-1 text-slate-450 hover:text-slate-700 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <ArrowDown size={13} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveAction(index, e)}
                        className="p-1 text-slate-450 hover:text-rose-600 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  
                  <div className="pl-6 select-none">
                    
                    {(act.type === 'ADD_TAG' || act.type === 'REMOVE_TAG') && (
                      <div className="max-w-xs">
                        <TagSearchSelect
                          tagName={act.tagName || ''}
                          tags={tags}
                          onChange={(selectedTag) => {
                            handleModifyAction(index, {
                              tagId: selectedTag ? String(selectedTag.id) : '',
                              tagName: selectedTag ? selectedTag.name : ''
                            });
                          }}
                          onCreateTag={() => {
                            setCurrentActionIndexForTag(index);
                            setIsTagModalOpen(true);
                          }}
                        />
                      </div>
                    )}
                                         
                    {act.type === 'SET_USER_FIELD' && (
                      <div className="text-xs text-slate-650 font-bold leading-relaxed relative">
                        <div>
                          Set &nbsp;
                          <span
                            onClick={() => setActivePopoverIndex(activePopoverIndex === index ? null : index)}
                            className="underline decoration-dashed decoration-[#407BFF] cursor-pointer text-[#407BFF] font-bold hover:text-blue-700 select-none"
                          >
                            {act.fieldName || 'select field'}
                          </span>
                          &nbsp; to &nbsp;
                          <span
                            onClick={() => setActivePopoverIndex(activePopoverIndex === index ? null : index)}
                            className="underline decoration-dashed decoration-[#407BFF] cursor-pointer text-[#407BFF] font-bold hover:text-blue-700 select-none"
                          >
                            {act.fieldValue || 'enter value'}
                          </span>
                        </div>

                        {activePopoverIndex === index && (
                          <SetUserFieldPopover
                            fieldName={act.fieldName || ''}
                            fieldValue={act.fieldValue || ''}
                            userFields={userFields}
                            tags={tags}
                            onClose={() => setActivePopoverIndex(null)}
                            onSave={(updatedFields) => handleModifyAction(index, updatedFields)}
                            onCreateNewField={() => {
                              setCurrentActionIndexForField(index);
                              setIsFieldModalOpen(true);
                            }}
                          />
                        )}
                      </div>
                    )}

                    {act.type === 'CLEAR_USER_FIELD' && (
                      <div className="text-xs text-slate-650 font-bold leading-relaxed relative">
                        <div>
                          Clear &nbsp;
                          <span
                            onClick={() => setActivePopoverIndex(activePopoverIndex === index ? null : index)}
                            className="underline decoration-dashed decoration-[#407BFF] cursor-pointer text-[#407BFF] font-bold hover:text-blue-700 select-none"
                          >
                            {act.fieldName || 'select field'}
                          </span>
                        </div>

                        {activePopoverIndex === index && (
                          <SetUserFieldPopover
                            fieldName={act.fieldName || ''}
                            fieldValue=""
                            userFields={userFields}
                            tags={tags}
                            onClose={() => setActivePopoverIndex(null)}
                            onSave={(updatedFields) => handleModifyAction(index, { fieldName: updatedFields.fieldName })}
                            onCreateNewField={() => {
                              setCurrentActionIndexForField(index);
                              setIsFieldModalOpen(true);
                            }}
                            hideValue={true}
                          />
                        )}
                      </div>
                    )}

                    
                    {(act.type === 'GS_INSERT_ROW' || act.type === 'GS_GET_ROW' || act.type === 'GS_UPDATE_ROW') && (
                      <div className="text-xs text-slate-650 font-bold leading-relaxed">
                        <span
                          onClick={() => handleOpenSheetsConfigModal(index)}
                          className="underline cursor-pointer text-[#407BFF] font-bold hover:text-blue-700"
                        >
                          {act.type === 'GS_INSERT_ROW' ? 'Insert Row' : act.type === 'GS_GET_ROW' ? 'Get Row by Value' : 'Update Row'}
                        </span>
                        {act.spreadsheetId && (
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                            Sheet: {act.sheetName || 'Sheet1'}
                          </span>
                        )}
                      </div>
                    )}

                    
                    {(act.type === 'TELEGRAM_SUBSCRIBE' || act.type === 'TELEGRAM_UNSUBSCRIBE') && (
                      <div className="text-[10px] text-slate-400 font-semibold italic">
                        {act.type === 'TELEGRAM_SUBSCRIBE' ? 'Subscribe contact to Telegram updates' : 'Unsubscribe contact from Telegram updates'}
                      </div>
                    )}

                    
                    {act.type === 'MARK_DONE' && (
                      <div className="text-[10px] text-slate-400 font-semibold italic">
                        Mark the active conversation as done
                      </div>
                    )}
                    {act.type === 'ASSIGN_AGENT' && (
                                            <div className="text-[10px] text-slate-400 font-semibold italic">
                        Assign session to live chat support agent
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      
      <div className="space-y-3 mt-3">
        <button
          onClick={() => setIsActionPickerOpen(true)}
          className="w-full py-2.5 border border-dashed border-[#EED796] hover:border-[#ffb200] hover:bg-amber-50/30 text-[#ffb200] hover:text-[#ff9f00] text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
        >
          <Plus size={14} />
          <span>+ Action</span>
        </button>

        {!!editorState && (
          <button
            onClick={() => (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true)}
            className="w-full py-2.5 border border-[#407BFF] hover:bg-blue-50/10 text-[#407BFF] hover:text-[#2d6ae5] text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-xs"
          >
            <span>Choose Next Step</span>
          </button>
        )}
      </div>

      
                  {isActionPickerOpen && createPortal((
        <div 
          onClick={() => {
            setIsActionPickerOpen(false);
            setSearchQuery('');
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/20 p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[780px] h-[580px] flex overflow-hidden animate-in zoom-in-95 duration-200 relative"
          >
            <button
              onClick={() => {
                setIsActionPickerOpen(false);
                setSearchQuery('');
              }}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-all cursor-pointer z-50"
            >
              <X size={16} />
            </button>

                        
            <div className="w-[190px] border-r border-slate-100 bg-white p-5 flex flex-col gap-1 select-none shrink-0">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4 mt-6 leading-snug">
                Perform next actions...
              </h2>
              {[
                { id: 'recently_used', name: 'Recently used' },
                { id: 'contact', name: 'Contact Data' },
                { id: 'automation', name: 'Automation' },
                { id: 'live_chat', name: 'Live Chat' },
                { id: 'sheets', name: 'Google Sheets' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSearchQuery('');
                  }}
                  className={`w-full text-left px-3 py-2 rounded-sm text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id && !searchQuery
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

                        
            <div className="flex-1 p-7 overflow-y-auto custom-scrollbar flex flex-col gap-5">
              <div className="flex flex-col gap-3">
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Search actions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 text-xs font-semibold bg-white"
                  />
                </div>
              </div>

              {searchQuery ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search Results</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Found {filteredActions.length} matching actions.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {filteredActions.map((act) => (
                      <button
                        key={act.type}
                        onClick={() => {
                          handleAddAction(act.type);
                          setIsActionPickerOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 rounded-md transition-all cursor-pointer flex gap-3.5 items-center group bg-white"
                      >
                        <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 transition-colors">
                          {act.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-800 transition-colors">{act.title}</h4>
                            {act.pro && (
                              <span className="text-[8px] font-extrabold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                PRO
                              </span>
                            )}
                            <span className="text-[9px] font-extrabold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-auto capitalize">
                              {act.category === 'sheets' ? 'Google Sheets' : act.category === 'live_chat' ? 'Live Chat' : act.category === 'recently_used' ? 'Recent' : act.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                        </div>
                      </button>
                    ))}
                    {filteredActions.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 mb-3 border border-slate-100">
                          <Search size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No actions found</p>
                        <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Try searching for another keyword.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {selectedCategory === 'recently_used' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800">Recently used</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Quickly access your most frequently used actions.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-150">
                        {allActions.filter(a => a.type === 'ADD_TAG' || a.type === 'GS_INSERT_ROW').map((act) => (
                          <button
                            key={act.type}
                            onClick={() => {
                              handleAddAction(act.type);
                              setIsActionPickerOpen(false);
                            }}
                            className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 rounded-md transition-all cursor-pointer flex gap-3.5 items-center group bg-white"
                          >
                            <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 transition-colors">
                              {act.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-extrabold text-slate-800 transition-colors">{act.title}</h4>
                                {act.pro && (
                                  <span className="text-[8px] font-extrabold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'contact' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800">Contact data</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Manage tags and custom user fields.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-150">
                        {allActions.filter(a => a.category === 'contact').map((act) => (
                          <button
                            key={act.type}
                            onClick={() => {
                              handleAddAction(act.type);
                              setIsActionPickerOpen(false);
                            }}
                            className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 rounded-md transition-all cursor-pointer flex gap-3.5 items-center group bg-white"
                          >
                            <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 transition-colors">
                              {act.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-extrabold text-slate-800 transition-colors">{act.title}</h4>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'automation' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800">Automation</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Control bot behavior and subscription settings.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-150">
                        {allActions.filter(a => a.category === 'automation').map((act) => (
                          <button
                            key={act.type}
                            onClick={() => {
                              handleAddAction(act.type);
                              setIsActionPickerOpen(false);
                            }}
                            className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 rounded-md transition-all cursor-pointer flex gap-3.5 items-center group bg-white"
                          >
                            <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 transition-colors">
                              {act.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-extrabold text-slate-800 transition-colors">{act.title}</h4>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCategory === 'live_chat' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800">Live Chat</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">Manage live agent sessions and conversation routing.</p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-150">
                        {allActions.filter(a => a.category === 'live_chat').map((act) => (
                          <button
                            key={act.type}
                            onClick={() => {
                              handleAddAction(act.type);
                              setIsActionPickerOpen(false);
                            }}
                            className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 rounded-md transition-all cursor-pointer flex gap-3.5 items-center group bg-white"
                          >
                            <div className="w-8 h-8 rounded-md bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 transition-colors">
                              {act.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-extrabold text-slate-800 transition-colors">{act.title}</h4>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  

                  {selectedCategory === 'sheets' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-800">Google Sheets</h3>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          The integration provides you with an ability to save customers data from Launchly bot to Google Sheets.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-150">
                        {allActions.filter(a => a.category === 'sheets').map((act) => (
                          <button
                            key={act.type}
                            onClick={() => {
                              handleAddAction(act.type);
                              setIsActionPickerOpen(false);
                            }}
                            className="w-full text-left p-4 border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 rounded-md transition-all cursor-pointer flex gap-3.5 items-center group bg-white"
                          >
                            <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 transition-colors">
                              {act.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-extrabold text-slate-800 transition-colors">{act.title}</h4>
                                {act.pro && (
                                  <span className="text-[8px] font-extrabold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    PRO
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-semibold mt-0.5">{act.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ), document.body)}

      
      <GoogleSheetsConfigModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        sheetsAction={sheetsAction!}
        isGoogleSheetsConnected={isGoogleSheetsConnected}
        isLoadingSpreadsheets={isLoadingSpreadsheets}
        spreadsheets={spreadsheets}
        spreadsheetsError={spreadsheetsError}
        isLoadingWorksheets={isLoadingWorksheets}
        worksheets={worksheets}
        worksheetsError={worksheetsError}
        isLoadingHeaders={isLoadingHeaders}
        headers={headers}
        tags={tags}
        customFields={customFields}
        handleSpreadsheetChange={handleSpreadsheetChange}
        handleWorksheetChange={handleWorksheetChange}
        handleRefreshHeaders={handleRefreshHeaders}
        handleMappingValueChange={handleMappingValueChange}
        handleSaveSheetsConfig={handleSaveSheetsConfig}
        handleReconnectGoogleSheets={handleReconnectGoogleSheets}
        handleLookupColumnChange={handleLookupColumnChange}
        handleLookupValueChange={handleLookupValueChange}
      />

                  
      {isTagModalOpen && createPortal((
        <div 
          onClick={() => setIsTagModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/20 p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl w-full max-w-[520px] flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Create tag
              </h3>
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              A tag is simply a label used to describe an identifying characteristic about a contact so you can sort and organize your audience. Tags allow you to segment your contacts.
            </p>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 select-none">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 select-none">
                  Folder
                </label>
                <input
                  type="text"
                  value={newTagFolder}
                  onChange={(e) => setNewTagFolder(e.target.value)}
                  placeholder="Tags"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-between pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setIsTagModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTagSubmit}
                disabled={!newTagName.trim() || createTagMutation.isPending}
                className="px-5 py-2.5 bg-[#407BFF] hover:bg-blue-600 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow shadow-blue-100"
              >
                {createTagMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

                  
      {isFieldModalOpen && createPortal((
        <div 
          onClick={() => setIsFieldModalOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/20 p-4 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-3xl p-7 shadow-2xl w-full max-w-[520px] flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-slate-800"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Create New User Field
              </h3>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Custom attributes let you save info about your contacts. Store user emails, phones, appointments, behavior or anything else you wish. Later you can segment your audience based on this data.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 select-none">
                  <span>Name</span>
                  <span className="text-rose-500">*</span>
                  <span className="text-slate-400 cursor-help" title="Enter the unique key for this field">?</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. favorite_color"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 select-none">
                  <span>Type</span>
                  <span className="text-slate-400 cursor-help" title="Select data type">?</span>
                </label>
                <div className="relative">
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white appearance-none cursor-pointer"
                  >
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Boolean">Boolean</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 select-none">
                <span>Description (Optional)</span>
                <span className="text-slate-400 cursor-help" title="Describe the purpose of this field">?</span>
              </label>
              <textarea
                value={newFieldDesc}
                onChange={(e) => setNewFieldDesc(e.target.value)}
                placeholder="What is this field used for?"
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20 resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 select-none">
                <span>Folder</span>
                <span className="text-slate-400 cursor-help" title="Select or specify folder">?</span>
              </label>
              <input
                type="text"
                value={newFieldFolder}
                onChange={(e) => setNewFieldFolder(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
              />
            </div>

            <div className="flex gap-2.5 justify-between pt-2 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFieldSubmit}
                disabled={!newFieldName.trim()}
                className="px-5 py-2.5 bg-[#407BFF] hover:bg-blue-600 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow shadow-blue-100"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  );
};
