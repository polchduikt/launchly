import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronDown } from 'lucide-react';

export interface CreateFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateField: (field: { name: string; type: string; description: string; folder?: string }) => void;
}

export const CreateFieldModal: React.FC<CreateFieldModalProps> = ({
  isOpen,
  onClose,
  onCreateField
}) => {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('Text');
  const [newFieldDesc, setNewFieldDesc] = useState('');
  const [newFieldFolder, setNewFieldFolder] = useState('User Fields');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!newFieldName.trim()) return;
    onCreateField({
      name: newFieldName.trim(),
      type: newFieldType,
      description: newFieldDesc.trim(),
      folder: newFieldFolder.trim(),
    });
    setNewFieldName('');
    setNewFieldDesc('');
    setNewFieldType('Text');
    setNewFieldFolder('User Fields');
  };

  const handleClose = () => {
    onClose();
    setNewFieldName('');
    setNewFieldDesc('');
    setNewFieldType('Text');
    setNewFieldFolder('User Fields');
  };

  return createPortal(
    <div
      onClick={handleClose}
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
            onClick={handleClose}
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
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newFieldName.trim()}
            className="px-5 py-2.5 bg-[#407BFF] hover:bg-blue-600 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow shadow-blue-100"
          >
            Create
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
