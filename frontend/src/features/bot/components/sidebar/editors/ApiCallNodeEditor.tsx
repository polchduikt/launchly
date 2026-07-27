import React, { useState } from 'react';
import type { CustomNodeData } from '../../../../../types/bot';
import { API_METHODS } from '../../../config/editorOptions';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { t } from '../../../../../i18n/config';

interface ApiCallNodeEditorProps {
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
}

export const ApiCallNodeEditor: React.FC<ApiCallNodeEditorProps> = ({ data, handleChange }) => {
  const method = typeof data.method === 'string' ? data.method : 'POST';
  const url = typeof data.url === 'string' ? data.url : '';
  const body = typeof data.body === 'string' ? data.body : '';
  const responseVariable = typeof data.responseVariable === 'string' ? data.responseVariable : 'api_response';
  
  const rawHeaders = data.headers;
  const headers = (rawHeaders && typeof rawHeaders === 'object' && !Array.isArray(rawHeaders))
    ? (rawHeaders as Record<string, string>)
    : {};

  const [activeTab, setActiveTab] = useState<'settings' | 'headers' | 'body'>('settings');

  const handleHeaderChange = (oldKey: string, newKey: string, newValue: string) => {
    const updated = { ...headers };
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }
    if (newKey.trim()) {
      updated[newKey] = newValue;
    }
    handleChange('headers', updated);
  };

  const handleAddHeader = () => {
    const updated = { ...headers };
    let newKey = 'New-Header';
    let counter = 1;
    while (updated.hasOwnProperty(newKey)) {
      newKey = `New-Header-${counter}`;
      counter++;
    }
    updated[newKey] = '';
    handleChange('headers', updated);
  };

  const handleRemoveHeader = (key: string) => {
    const updated = { ...headers };
    delete updated[key];
    handleChange('headers', updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex border-b border-slate-100 pb-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('editor.api_call.tabs.settings')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === 'headers'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('editor.api_call.tabs.headers')}
          {Object.keys(headers).length > 0 && (
            <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-extrabold">
              {Object.keys(headers).length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'body'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {t('editor.api_call.tabs.body')}
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {t('editor.api_call.request_details')}
            </label>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-indigo-500 transition-all bg-white shadow-3xs">
              <select
                id="apiMethod"
                value={method}
                onChange={(e) => {
                  const newMethod = e.target.value;
                  handleChange('method', newMethod);
                  if (!['POST', 'PUT', 'PATCH'].includes(newMethod.toUpperCase()) && activeTab === 'body') {
                    setActiveTab('settings');
                  }
                }}
                className="px-3 py-2.5 border-r border-slate-200 focus:outline-none text-xs font-extrabold bg-slate-50 text-slate-700 cursor-pointer"
              >
                {API_METHODS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                id="apiUrl"
                type="text"
                value={url}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.yourdomain.com/v1/webhook"
                className="flex-1 px-3 py-2.5 focus:outline-none text-xs font-semibold"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1.5">
              {t('editor.api_call.supports_placeholders')}{' '}
              <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono font-bold text-[9px]">{"{{telegramId}}"}</code> or <code className="bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-mono font-bold text-[9px]">{"{{phone}}"}</code>.
            </p>
          </div>

          <div>
            <label htmlFor="responseVariable" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {t('editor.api_call.save_response_var')}
            </label>
            <div className="relative">
              <input
                id="responseVariable"
                type="text"
                value={responseVariable}
                onChange={(e) => handleChange('responseVariable', e.target.value)}
                placeholder="api_response"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold transition-all bg-slate-50/20"
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mt-2.5 space-y-1.5">
              <div className="flex gap-1.5 items-start text-[10px] text-slate-500 leading-normal font-semibold">
                <HelpCircle size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <p>{t('editor.api_call.variables_populated')}</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 font-mono text-[9px] text-slate-600 font-bold bg-white p-2 rounded-lg border border-slate-100">
                    <li><code className="text-indigo-600">{`{{${responseVariable}}}`}</code> - response body text</li>
                    <li><code className="text-indigo-600">{`{{${responseVariable}_status}}`}</code> - HTTP status code (e.g. 200)</li>
                    <li><code className="text-indigo-600">{`{{${responseVariable}_error}}`}</code> - network error message if failed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'headers' && (
        <div className="space-y-3 pt-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {t('editor.api_call.headers_label')}
            </span>
            <button
              type="button"
              onClick={handleAddHeader}
              className="text-[10px] text-indigo-600 hover:text-indigo-700 font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              {t('editor.api_call.add_header')}
            </button>
          </div>

          {Object.keys(headers).length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 italic font-medium select-none bg-slate-50/20">
              {t('editor.api_call.no_headers')}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {Object.entries(headers).map(([key, value], idx) => (
                <div key={key + idx} className="flex gap-2 items-center bg-slate-50/45 p-2 rounded-xl border border-slate-100">
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      defaultValue={key}
                      placeholder={t('editor.api_call.header_name')}
                      onBlur={(e) => {
                        const newKey = e.target.value.trim();
                        if (newKey && newKey !== key) {
                          handleHeaderChange(key, newKey, value);
                        } else {
                          e.target.value = key;
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 text-[11px] font-bold bg-white"
                    />
                    <input
                      type="text"
                      value={value}
                      placeholder={t('editor.api_call.header_value')}
                      onChange={(e) => handleHeaderChange(key, key, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 text-[11px] font-semibold bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(key)}
                    className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-all cursor-pointer shrink-0"
                    title={t('editor.api_call.remove_header')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'body' && (
        <div className="space-y-2 pt-1">
          <label htmlFor="apiBody" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('editor.api_call.body_payload')}
          </label>
          <textarea
            id="apiBody"
            rows={6}
            value={body}
            onChange={(e) => handleChange('body', e.target.value)}
            placeholder={`{\n  "userId": "{{telegramId}}",\n  "status": "active"\n}`}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono transition-all bg-slate-50/20 leading-normal resize-y min-h-32"
          />
          <p className="text-[10px] text-slate-400 font-medium">
            {t('editor.api_call.body_desc')}
          </p>
        </div>
      )}
    </div>
  );
};
