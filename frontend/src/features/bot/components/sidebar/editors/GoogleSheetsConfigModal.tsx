import React from 'react';
import { createPortal } from 'react-dom';
import { X, FileSpreadsheet, AlertTriangle, Info, ChevronDown, RefreshCw } from 'lucide-react';
import { FieldVariableSelector } from './FieldVariableSelector';
import type { GoogleSheetsConfigModalProps } from '../../../../../types/bot';

export const GoogleSheetsConfigModal: React.FC<GoogleSheetsConfigModalProps> = ({
  isOpen,
  onClose,
  sheetsAction,
  isGoogleSheetsConnected,
  isLoadingSpreadsheets,
  spreadsheets,
  spreadsheetsError,
  isLoadingWorksheets,
  worksheets,
  worksheetsError,
  isLoadingHeaders,
  headers,
  tags,
  customFields,
  handleSpreadsheetChange,
  handleWorksheetChange,
  handleRefreshHeaders,
  handleMappingValueChange,
  handleSaveSheetsConfig,
  handleReconnectGoogleSheets,
}) => {
  if (!isOpen || !sheetsAction) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/20 p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-lg shadow-2xl w-full max-w-[900px] h-[720px] max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden"
      >
        <div className="relative border-b border-slate-100 px-8 py-3 text-center">
          <button
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
          <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
            Edit Google Sheets Actions
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-5 pb-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm text-emerald-600">
              <FileSpreadsheet size={48} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">
                Google Sheets Actions: Insert Row
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Send Launchly data to Google Sheets.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {!isGoogleSheetsConnected && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-[11px] text-amber-800 leading-relaxed font-semibold">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  Google Sheets integration is not connected or active. Please connect your account in{' '}
                  <a href="/settings" className="text-indigo-650 font-bold hover:underline">
                    Settings
                  </a>{' '}
                  first.
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-3 text-[11px] text-slate-500 leading-relaxed font-medium select-none">
              <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <div>
                The first row of the table is used for your column titles. You could easily match Launchly contact data with your columns by titles names.{' '}
                <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-650 font-bold hover:underline">
                  Help
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Spreadsheet
                </label>
                <div className="relative">
                  <select
                    value={sheetsAction.spreadsheetId || ''}
                    onChange={(e) => handleSpreadsheetChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white appearance-none cursor-pointer"
                  >
                    <option value="">
                      {isLoadingSpreadsheets ? 'Loading spreadsheets...' : '-- Select Spreadsheet --'}
                    </option>
                    {spreadsheets.map((sheet) => (
                      <option key={sheet.id} value={sheet.id}>
                        {sheet.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingSpreadsheets && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <RefreshCw size={14} className="animate-spin text-slate-400" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {spreadsheetsError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
                    <div>{spreadsheetsError}</div>
                    <button
                      type="button"
                      onClick={handleReconnectGoogleSheets}
                      className="mt-2 rounded-md bg-amber-100 px-3 py-1.5 text-[11px] font-extrabold text-amber-900 transition-colors hover:bg-amber-200"
                    >
                      Reconnect Google Sheets
                    </button>
                  </div>
                )}
                {!spreadsheetsError && !isLoadingSpreadsheets && spreadsheets.length === 0 && (
                  <div className="rounded-xl border border-slate-150 bg-slate-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-slate-500">
                    No spreadsheets found in this Google account.
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Worksheet
                </label>
                <div className="relative">
                  <select
                    value={sheetsAction.sheetName || ''}
                    disabled={!sheetsAction.spreadsheetId}
                    onChange={(e) => handleWorksheetChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    <option value="">
                      {isLoadingWorksheets ? 'Loading worksheets...' : '-- Select Worksheet --'}
                    </option>
                    {worksheets.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                  {isLoadingWorksheets && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <RefreshCw size={14} className="animate-spin text-slate-400" />
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <ChevronDown size={16} />
                  </div>
                </div>
                {worksheetsError && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-amber-800">
                    {worksheetsError}
                  </div>
                )}
              </div>

              {sheetsAction.spreadsheetId && sheetsAction.sheetName && (
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-[1fr_20px_1fr] gap-3 items-center select-none text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    <div>Launchly Data</div>
                    <div></div>
                    <div className="flex items-center justify-between">
                      <span>Google Column Titles</span>
                      <button
                        type="button"
                        onClick={handleRefreshHeaders}
                        disabled={isLoadingHeaders}
                        className="text-[#407BFF] hover:underline font-bold text-[10px] lowercase tracking-normal flex items-center gap-0.5 cursor-pointer normal-case"
                      >
                        {isLoadingHeaders && <RefreshCw size={10} className="animate-spin" />}
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {isLoadingHeaders ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-bold">
                      Loading column headers...
                    </div>
                  ) : headers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No headers found. Make sure your spreadsheet's first row has columns.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {headers.map((header, hIdx) => {
                        const currentMapping = (sheetsAction.columnMappings || []).find((m) => m.column === header);
                        const val = currentMapping ? currentMapping.value : '';
                        return (
                          <div key={hIdx} className="grid grid-cols-[1fr_20px_1fr] gap-3 items-center relative">
                            <div className="relative flex items-center">
                              <span className="absolute left-3.5 text-slate-400 text-xs font-extrabold select-none">T</span>
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleMappingValueChange(header, e.target.value)}
                                placeholder="Type or insert variable"
                                className="w-full pl-8 pr-16 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white"
                              />

                              <div className="absolute right-2 flex items-center gap-1">
                                {val && (
                                  <button
                                    type="button"
                                    onClick={() => handleMappingValueChange(header, '')}
                                    className="p-1 text-slate-350 hover:text-rose-500 rounded-md transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                                <FieldVariableSelector
                                  mode="variable"
                                  tags={tags}
                                  customFields={customFields}
                                  position="top"
                                  onSelect={(selectedVar) => handleMappingValueChange(header, selectedVar)}
                                />
                              </div>
                            </div>

                            <span className="text-slate-300 font-extrabold select-none">-&gt;</span>

                            <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-150 rounded-md text-xs font-extrabold text-slate-700 select-none truncate">
                              {header}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-3 px-8 py-4 border-t border-slate-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold rounded-md transition-all cursor-pointer select-none"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!sheetsAction.spreadsheetId || !sheetsAction.sheetName}
            onClick={handleSaveSheetsConfig}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-md transition-all cursor-pointer shadow shadow-blue-100 select-none"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
