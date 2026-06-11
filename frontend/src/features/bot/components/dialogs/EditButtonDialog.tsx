import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

interface EditButtonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  button: { label: string; value: string } | null;
  onSave: (updated: { label: string; value: string }) => void;
  onRemove: () => void;
}

export const EditButtonDialog: React.FC<EditButtonDialogProps> = ({
  isOpen,
  onClose,
  button,
  onSave,
  onRemove,
}) => {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (button) {
      setLabel(button.label);
    } else {
      setLabel('');
    }
  }, [button]);

  if (!isOpen || !button) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      value: button.value || `btn_${Date.now()}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Edit Button</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="btnLabel" className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Button Title
            </label>
            <input
              id="btnLabel"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Call Support"
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm transition-all bg-slate-50/30"
              autoFocus
            />
            <span className="text-[10px] text-slate-400 mt-1 block text-right font-medium">
              {label.length}/20 characters
            </span>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all border border-rose-100 cursor-pointer"
            >
              <Trash2 size={14} />
              <span>Remove</span>
            </button>
            
            <div className="flex-1 flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!label.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow shadow-indigo-100 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
