import React, { useState, useEffect } from 'react';
import { X, Trash2, Send, Sparkles, Globe, CreditCard, Zap, GitFork, Shuffle, Clock, Play } from 'lucide-react';
import type { EditButtonDrawerProps } from '../../../../../types/bot';

export const EditButtonDrawer: React.FC<EditButtonDrawerProps> = ({
  onClose,
  button,
  onSave,
  onRemove,
}) => {
  const [label, setLabel] = useState('');
  const [actionType, setActionType] = useState('TELEGRAM');
  const [actionTarget, setActionTarget] = useState('');

  useEffect(() => {
    if (button) {
      setLabel(button.label || '');
      setActionType(button.actionType || 'TELEGRAM');
      setActionTarget(button.actionTarget || '');
    } else {
      setLabel('');
      setActionType('TELEGRAM');
      setActionTarget('');
    }
  }, [button]);

  if (!button) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    onSave({
      ...button,
      label: label.trim(),
      actionType,
      actionTarget: actionType === 'URL' ? actionTarget.trim() : '',
    });
    onClose();
  };

  const actionOptions = [
    { type: 'TELEGRAM', label: 'Telegram', icon: Send, color: 'text-sky-500 bg-sky-50' },
    { type: 'AI_STEP', label: 'AI Step', icon: Sparkles, color: 'text-indigo-500 bg-indigo-50' },
    { type: 'URL', label: 'Open website', icon: Globe, color: 'text-emerald-500 bg-emerald-50' },
    { type: 'BUY', label: 'Buy Button', icon: CreditCard, color: 'text-amber-500 bg-amber-50', pro: true },
    { type: 'ACTIONS', label: 'Perform Actions', icon: Zap, color: 'text-purple-500 bg-purple-50' },
    { type: 'CONDITION', label: 'Condition', icon: GitFork, color: 'text-rose-500 bg-rose-50', pro: true },
    { type: 'RANDOM', label: 'Randomizer', icon: Shuffle, color: 'text-violet-500 bg-violet-50', pro: true },
    { type: 'DELAY', label: 'Smart Delay', icon: Clock, color: 'text-cyan-500 bg-cyan-50', pro: true },
    { type: 'AUTOMATION', label: 'Start another Automation', icon: Play, color: 'text-teal-500 bg-teal-50' },
  ];

  return (
    <div className="h-full flex flex-col justify-between bg-white font-sans w-full">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 select-none shrink-0">
        <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Edit Button</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar flex flex-col justify-between">
        <div className="space-y-5">
          <div>
            <label htmlFor="btnLabel" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Button title
            </label>
            <div className="relative">
              <input
                id="btnLabel"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Learn More"
                maxLength={25}
                className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold transition-all bg-slate-50/20"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">
                {label.length}/25
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              When this button is pressed
            </label>
            <div className="space-y-1 bg-slate-50/20 border border-slate-100 rounded-2xl p-1.5">
              {actionOptions.map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = actionType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setActionType(opt.type)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border cursor-pointer select-none group ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 text-indigo-900 font-bold'
                        : 'border-transparent hover:bg-slate-50 text-slate-700 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${opt.color}`}>
                        <IconComponent size={13} />
                      </span>
                      <span className="text-[11px] font-semibold">{opt.label}</span>
                    </div>
                    {opt.pro && (
                      <span className="text-[8px] font-extrabold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        PRO
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {actionType === 'URL' && (
            <div className="animate-fade-in">
              <label htmlFor="btnUrl" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Website URL Link
              </label>
              <input
                id="btnUrl"
                type="text"
                value={actionTarget}
                onChange={(e) => setActionTarget(e.target.value)}
                placeholder="e.g. https://yoursite.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold transition-all bg-slate-50/20"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 select-none shrink-0 mt-6">
          <button
            type="button"
            onClick={() => {
              onRemove();
              onClose();
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-105 hover:text-rose-700 text-rose-600 text-[11px] font-bold rounded-xl transition-all border border-rose-100 cursor-pointer shadow-sm"
          >
            <Trash2 size={13} />
            <span>Remove</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label.trim() || (actionType === 'URL' && !actionTarget.trim())}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-xl transition-all shadow shadow-indigo-150 cursor-pointer disabled:cursor-not-allowed"
            >
              Done
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
