import { useState } from 'react';
import type { ActionItem } from '../../../../../../../types/bot';
import apiClient from '../../../../../../../api/axios';

interface UseGoogleSheetsActionsProps {
  activeBotId: number | null;
  actions: ActionItem[];
  onModifyAction: (index: number, fields: Partial<ActionItem>) => void;
}

export const useGoogleSheetsActions = ({
  activeBotId,
  actions,
  onModifyAction,
}: UseGoogleSheetsActionsProps) => {
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
    const matched = availableSpreadsheets.find(
      (sheet) => sheet.id === trimmedValue || sheet.name.trim().toLowerCase() === trimmedValue.toLowerCase()
    );
    return matched?.id || value;
  };

  const handleReconnectGoogleSheets = () => {
    if (!activeBotId) return;
    window.location.href = `/api/v1/integrations/google/auth?botId=${activeBotId}`;
  };

  const fetchSpreadsheets = async () => {
    setIsLoadingSpreadsheets(true);
    setSpreadsheetsError('');
    try {
      const res = await apiClient.get<{ id: string; name: string }[]>('/integrations/google/spreadsheets', {
        params: { botId: activeBotId },
      });
      setSpreadsheets(res.data);
      return res.data;
    } catch (e: any) {
      console.error('Failed to fetch spreadsheets', e);
      setSpreadsheets([]);
      const message = e?.response?.data?.message || e?.message || 'Failed to load Google spreadsheets.';
      setSpreadsheetsError(
        message.includes('No static resource')
          ? 'Google Sheets API endpoint is not available. Restart the backend so the latest integrations routes are loaded.'
          : message
      );
    } finally {
      setIsLoadingSpreadsheets(false);
    }
    return [];
  };

  const fetchWorksheets = async (spreadsheetId: string) => {
    setIsLoadingWorksheets(true);
    setWorksheetsError('');
    try {
      const res = await apiClient.get<string[]>(`/integrations/google/spreadsheets/${spreadsheetId}/worksheets`, {
        params: { botId: activeBotId },
      });
      setWorksheets(res.data);
    } catch (e: any) {
      console.error('Failed to fetch worksheets', e);
      setWorksheets([]);
      const message = e?.response?.data?.message || e?.message || 'Failed to load worksheets.';
      setWorksheetsError(message);
    } finally {
      setIsLoadingWorksheets(false);
    }
  };

  const fetchHeaders = async (spreadsheetId: string, worksheetName: string) => {
    setIsLoadingHeaders(true);
    try {
      const encodedSheet = encodeURIComponent(worksheetName);
      const res = await apiClient.get<string[]>(`/integrations/google/spreadsheets/${spreadsheetId}/values/${encodedSheet}/headers`, {
        params: { botId: activeBotId },
      });
      return res.data;
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
        setSheetsAction((prev) => (prev ? { ...prev, spreadsheetId: resolvedSpreadsheetId } : null));
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
    setSheetsAction((prev) => (prev ? { ...prev, spreadsheetId, sheetName: '', columnMappings: [] } : null));
    setWorksheets([]);
    setHeaders([]);
    setWorksheetsError('');
    if (spreadsheetId) {
      fetchWorksheets(spreadsheetId);
    }
  };

  const handleWorksheetChange = async (sheetName: string) => {
    setSheetsAction((prev) => (prev ? { ...prev, sheetName, columnMappings: [] } : null));
    setHeaders([]);
    if (sheetsAction?.spreadsheetId && sheetName) {
      const fetchedHeaders = await fetchHeaders(sheetsAction.spreadsheetId, sheetName);
      setHeaders(fetchedHeaders);
      const defaultMappings = fetchedHeaders.map((header) => ({ column: header, value: '' }));
      setSheetsAction((prev) => (prev ? { ...prev, columnMappings: defaultMappings } : null));
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
      setSheetsAction((prev) => (prev ? { ...prev, columnMappings: newMappings } : null));
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
    setSheetsAction((prev) => (prev ? { ...prev, lookupColumn } : null));
  };

  const handleLookupValueChange = (lookupValue: string) => {
    setSheetsAction((prev) => (prev ? { ...prev, lookupValue } : null));
  };

  const handleSaveSheetsConfig = () => {
    if (editingActionIndex !== null && sheetsAction) {
      onModifyAction(editingActionIndex, sheetsAction);
      setIsSheetsModalOpen(false);
      setEditingActionIndex(null);
    }
  };

  return {
    isSheetsModalOpen,
    setIsSheetsModalOpen,
    sheetsAction,
    spreadsheets,
    worksheets,
    headers,
    isLoadingSpreadsheets,
    isLoadingWorksheets,
    isLoadingHeaders,
    spreadsheetsError,
    worksheetsError,
    handleOpenSheetsConfigModal,
    handleSpreadsheetChange,
    handleWorksheetChange,
    handleRefreshHeaders,
    handleMappingValueChange,
    handleLookupColumnChange,
    handleLookupValueChange,
    handleSaveSheetsConfig,
    handleReconnectGoogleSheets,
  };
};
