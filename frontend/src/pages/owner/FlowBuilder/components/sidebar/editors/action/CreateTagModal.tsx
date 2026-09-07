import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTag: (name: string, folder: string) => Promise<void>;
  isPending: boolean;
}

export const CreateTagModal: React.FC<CreateTagModalProps> = ({
  isOpen,
  onClose,
  onCreateTag,
  isPending
}) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagFolder, setNewTagFolder] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!newTagName.trim()) return;
    await onCreateTag(newTagName.trim(), newTagFolder.trim());
    setNewTagName('');
    setNewTagFolder('');
  };

  const handleClose = () => {
    onClose();
    setNewTagName('');
    setNewTagFolder('');
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
            Create tag
          </h3>
          <button
            onClick={handleClose}
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
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newTagName.trim() || isPending}
            className="px-5 py-2.5 bg-[#407BFF] hover:bg-blue-600 disabled:opacity-55 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow shadow-blue-100"
          >
            {isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
