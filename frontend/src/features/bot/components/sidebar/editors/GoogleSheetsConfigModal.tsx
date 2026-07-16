import React from 'react';
import { createPortal } from 'react-dom';
import { X, FileSpreadsheet, AlertTriangle, Info, ChevronDown, RefreshCw } from 'lucide-react';
import { FieldVariableSelector } from './FieldVariableSelector';
import type { GoogleSheetsConfigModalProps } from '../../../../../types/bot';
import { t } from '../../../../../i18n';

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
  handleLookupColumnChange,
  handleLookupValueChange,
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
            {t('editor.gs.modal_title')}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-5 pb-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm text-emerald-600">
              <FileSpreadsheet size={48} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-800">
                {sheetsAction.type === 'GS_INSERT_ROW' ? t('editor.gs.modal_subtitle.insert')
                  : sheetsAction.type === 'GS_GET_ROW' ? t('editor.gs.modal_subtitle.get')
                  : t('editor.gs.modal_subtitle.update')}
              </p>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {sheetsAction.type === 'GS_INSERT_ROW' ? t('editor.action.gs_insert_desc')
                  : sheetsAction.type === 'GS_GET_ROW' ? t('editor.action.gs_get_desc')
                  : t('editor.action.gs_update_desc')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {!isGoogleSheetsConnected && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-[11px] text-amber-800 leading-relaxed font-semibold">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  {t('editor.gs.not_connected')}
                </div>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-3 text-[11px] text-slate-500 leading-relaxed font-medium select-none">
              <Info size={16} className="text-indigo-500 shrink-0 mt-0.5" />
              <div>
                {t('editor.gs.help_desc')}{' '}
                <a href="https://google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-650 font-bold hover:underline">
                  {t('editor.gs.help_link')}
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('editor.gs.spreadsheet')}
                </label>
                <div className="relative">
                  <select
                    value={sheetsAction.spreadsheetId || ''}
                    onChange={(e) => handleSpreadsheetChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white appearance-none cursor-pointer"
                  >
                    <option value="">
                      {isLoadingSpreadsheets ? t('editor.gs.loading_spreadsheets') : t('editor.gs.select_spreadsheet')}
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
                      {t('editor.gs.reconnect')}
                    </button>
                  </div>
                )}
                {!spreadsheetsError && !isLoadingSpreadsheets && spreadsheets.length === 0 && (
                  <div className="rounded-xl border border-slate-150 bg-slate-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-slate-500">
                    {t('editor.gs.no_spreadsheets')}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t('editor.gs.worksheet')}
                </label>
                <div className="relative">
                  <select
                    value={sheetsAction.sheetName || ''}
                    disabled={!sheetsAction.spreadsheetId}
                    onChange={(e) => handleWorksheetChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white disabled:opacity-50 appearance-none cursor-pointer"
                  >
                    <option value="">
                      {isLoadingWorksheets ? t('editor.gs.loading_worksheets') : t('editor.gs.select_worksheet')}
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
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  {(sheetsAction.type === 'GS_GET_ROW' || sheetsAction.type === 'GS_UPDATE_ROW') && (
                    <div className="grid grid-cols-2 gap-4 pb-2 border-b border-slate-100">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('editor.gs.lookup_column')}
                        </label>
                        <div className="relative">
                          <select
                            value={sheetsAction.lookupColumn || ''}
                            onChange={(e) => handleLookupColumnChange(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white appearance-none cursor-pointer"
                          >
                            <option value="">{t('editor.gs.select_lookup')}</option>
                            {headers.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                            <ChevronDown size={16} />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {t('editor.gs.lookup_value')}
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-slate-400 text-xs font-extrabold select-none">T</span>
                          <input
                            type="text"
                            value={sheetsAction.lookupValue || ''}
                            onChange={(e) => handleLookupValueChange(e.target.value)}
                            placeholder={t('editor.gs.lookup_placeholder')}
                            className="w-full pl-8 pr-16 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white"
                          />
                          <div className="absolute right-2 flex items-center gap-1">
                            {sheetsAction.lookupValue && (
                              <button
                                type="button"
                                onClick={() => handleLookupValueChange('')}
                                className="p-1 text-slate-350 hover:text-rose-500 rounded-md transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                            <FieldVariableSelector
                              mode="variable"
                              tags={tags}
                              customFields={customFields}
                              position="bottom"
                              onSelect={(selectedVar) => {
                                const currentVal = sheetsAction.lookupValue || '';
                                const newVal = currentVal.trim() === '' ? selectedVar : `${currentVal} + ${selectedVar}`;
                                handleLookupValueChange(newVal);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-[1fr_20px_1fr] gap-3 items-center select-none text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                    <div>
                      {sheetsAction.type === 'GS_GET_ROW' ? t('editor.gs.col_titles.get') : t('editor.gs.col_titles.other')}
                    </div>
                    <div></div>
                    <div className="flex items-center justify-between">
                      <span>
                        {sheetsAction.type === 'GS_GET_ROW' ? t('editor.gs.col_values.get') : t('editor.gs.col_values.other')}
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshHeaders}
                        disabled={isLoadingHeaders}
                        className="text-[#407BFF] hover:underline font-bold text-[10px] lowercase tracking-normal flex items-center gap-0.5 cursor-pointer normal-case"
                      >
                        {isLoadingHeaders && <RefreshCw size={10} className="animate-spin" />}
                        <span>{t('editor.gs.refresh')}</span>
                      </button>
                    </div>
                  </div>

                  {isLoadingHeaders ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-bold">
                      {t('editor.gs.loading_headers')}
                    </div>
                  ) : headers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      {t('editor.gs.no_headers')}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {headers.map((header, hIdx) => {
                        const currentMapping = (sheetsAction.columnMappings || []).find((m) => m.column === header);
                        const val = currentMapping ? currentMapping.value : '';
                        
                        if (sheetsAction.type === 'GS_GET_ROW') {
                          return (
                            <div key={hIdx} className="grid grid-cols-[1fr_20px_1fr] gap-3 items-center relative">
                              <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-150 rounded-md text-xs font-extrabold text-slate-700 select-none truncate">
                                {header}
                              </div>

                              <span className="text-slate-300 font-extrabold select-none">-&gt;</span>

                              <div className="relative">
                                <select
                                  value={val}
                                  onChange={(e) => handleMappingValueChange(header, e.target.value)}
                                  className="w-full px-4 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-white cursor-pointer appearance-none"
                                >
                                  <option value="">{t('editor.gs.dont_map')}</option>
                                  <optgroup label={t('editor.gs.system_fields')}>
                                    <option value="first_name">{t('editor.gs.fields.first_name')}</option>
                                    <option value="last_name">{t('editor.gs.fields.last_name')}</option>
                                    <option value="username">{t('editor.gs.fields.username')}</option>
                                    <option value="phone">{t('editor.gs.fields.phone')}</option>
                                    <option value="email">{t('editor.gs.fields.email')}</option>
                                    <option value="telegram_user_id">{t('editor.gs.fields.tg_id')}</option>
                                    <option value="contact_id">{t('editor.gs.fields.contact_id')}</option>
                                    <option value="subscribed">{t('editor.gs.fields.subscribed')}</option>
                                  </optgroup>
                                  {customFields && customFields.length > 0 && (
                                    <optgroup label={t('editor.gs.custom_fields')}>
                                      {customFields.map((cf) => (
                                        <option key={cf} value={cf}>
                                          {cf}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                                  <ChevronDown size={16} />
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div key={hIdx} className="grid grid-cols-[1fr_20px_1fr] gap-3 items-center relative">
                              <div className="relative flex items-center">
                                <span className="absolute left-3.5 text-slate-400 text-xs font-extrabold select-none">T</span>
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => handleMappingValueChange(header, e.target.value)}
                                  placeholder={t('editor.gs.placeholder_input')}
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
                                    onSelect={(selectedVar) => {
                                      const currentVal = val || '';
                                      const newVal = currentVal.trim() === '' ? selectedVar : `${currentVal} + ${selectedVar}`;
                                      handleMappingValueChange(header, newVal);
                                    }}
                                  />
                                </div>
                              </div>

                              <span className="text-slate-300 font-extrabold select-none">-&gt;</span>

                              <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-150 rounded-md text-xs font-extrabold text-slate-700 select-none truncate">
                                {header}
                              </div>
                            </div>
                          );
                        }
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
            {t('editor.gs.cancel')}
          </button>
          <button
            type="button"
            disabled={!sheetsAction.spreadsheetId || !sheetsAction.sheetName}
            onClick={handleSaveSheetsConfig}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-md transition-all cursor-pointer shadow shadow-blue-100 select-none"
          >
            {t('editor.gs.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
