import React from 'react';
import { Plus, Trash2, Image as ImageIcon, Smile, Link as LinkIcon, Parentheses, Loader2, AlignLeft, Clock, Database, MoreHorizontal } from 'lucide-react';
import type { CustomNodeData, ButtonData } from '../../../../../types/bot';

interface MessageNodeEditorProps {
  data: CustomNodeData;
  buttons: ButtonData[];
  showImageUrlInput: boolean;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setShowImageUrlInput: (show: boolean) => void;
  handleChange: (key: string, value: unknown) => void;
  handleAddButton: () => void;
  handleOpenEditButton: (btn: ButtonData) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MessageNodeEditor: React.FC<MessageNodeEditorProps> = ({
  data,
  buttons,
  showImageUrlInput,
  isUploading,
  fileInputRef,
  setShowImageUrlInput,
  handleChange,
  handleAddButton,
  handleOpenEditButton,
  handleFileUpload,
}) => {
  return (
    <div className="space-y-4">
      <div className="border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 p-4 pb-2 relative flex flex-col min-h-[110px]">
          <textarea
            id="msgText"
            rows={3}
            value={data.text || ''}
            onChange={(e) => handleChange('text', e.target.value)}
            placeholder="Enter your text..."
            maxLength={2000}
            className="w-full text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent resize-none border-0 p-0 leading-relaxed"
          />
          <div className="absolute bottom-2.5 right-3 bg-slate-900 text-slate-200 px-2.5 py-1.5 rounded-xl flex items-center gap-2 shadow-md select-none">
            <button type="button" className="hover:text-white transition-colors">
              <LinkIcon size={12} className="stroke-[2.5]" />
            </button>
            <button type="button" className="hover:text-white transition-colors">
              <Smile size={12} className="stroke-[2.5]" />
            </button>
            <button type="button" className="hover:text-white transition-colors">
              <Parentheses size={12} className="stroke-[2.5]" />
            </button>
            <div className="w-[1px] h-3.5 bg-slate-700/60 my-0.5" />
            <span className="text-[10px] font-extrabold tracking-wider text-slate-300">
              {2000 - (data.text || '').length}
            </span>
          </div>
        </div>

        <div className="p-3 bg-white space-y-2 border-t border-slate-100">
          {buttons.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {buttons.map((btn, idx) => (
                <div
                  key={btn.value + idx}
                  className="flex justify-between items-center bg-white border border-slate-150 p-2.5 rounded-xl text-xs font-bold text-slate-700 shadow-sm"
                >
                  <span className="truncate flex-1 pr-4">{btn.label}</span>
                  <button
                    onClick={() => handleOpenEditButton(btn)}
                    className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer border border-slate-100 rounded-lg"
                  >
                    <Plus size={14} className="rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleAddButton}
            disabled={buttons.length >= 10}
            className="w-full py-2 bg-white hover:bg-slate-50 border border-dashed border-slate-200 hover:border-slate-300 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer select-none"
          >
            <Plus size={13} />
            <span>Add Button</span>
          </button>
        </div>
      </div>

      <button className="w-full py-2.5 bg-white hover:bg-slate-50 border border-dashed border-slate-200 text-slate-500 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm select-none">
        <Plus size={13} />
        <span>Telegram Menu</span>
      </button>

      {data.imageUrl && (
        <div className="border border-slate-200 bg-white p-3.5 rounded-2xl space-y-2.5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Image visual
          </span>
          <div className="border border-slate-150 bg-slate-50 p-2 rounded-xl flex items-center justify-between gap-3 shadow-sm">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0">
              <img src={data.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-slate-500 font-semibold truncate flex-1 leading-tight">
              {data.imageUrl}
            </span>
            <button
              onClick={() => handleChange('imageUrl', '')}
              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-rose-100"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}

      {!data.imageUrl && showImageUrlInput && (
        <div className="border border-slate-200 bg-white p-3.5 rounded-2xl space-y-3 shadow-sm animate-fade-in">
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isUploading ? <Loader2 size={13} className="animate-spin text-slate-400" /> : <ImageIcon size={13} className="text-indigo-500" />}
              <span>Upload File</span>
            </button>
            <button
              onClick={() => setShowImageUrlInput(false)}
              className="py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Cancel
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            type="text"
            placeholder="Or paste image URL link..."
            value={data.imageUrl || ''}
            onChange={(e) => handleChange('imageUrl', e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
          />
        </div>
      )}

      <div className="border-t border-slate-100 pt-4 space-y-3 select-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
          Add one of the content blocks:
        </span>
        <div className="grid grid-cols-1 gap-2.5">
          <button
            onClick={() => {
              if (!data.text) handleChange('text', 'Hello! Welcome to our platform.');
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-455 shrink-0">
                <AlignLeft size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Text</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Add simple text and buttons</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowImageUrlInput(true);
              if (!data.imageUrl) handleChange('imageUrl', 'https://images.unsplash.com/photo-1546961329-78bef0414d7c?q=80&w=600');
            }}
            className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="text-slate-455 shrink-0">
                <ImageIcon size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Image</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Boost engagement with visuals</p>
              </div>
            </div>
          </button>

          <button className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm opacity-60">
            <div className="flex items-center gap-3">
              <span className="text-slate-455 shrink-0">
                <Clock size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Delay</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Wait a few seconds in between texts</p>
              </div>
            </div>
          </button>

          <button className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-455 shrink-0">
                <Database size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Data Collection</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">Collect emails, phones and more</p>
              </div>
            </div>
            <span className="text-[8px] font-extrabold bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider mr-1">
              PRO
            </span>
          </button>

          <button className="w-full flex items-center justify-between px-3.5 py-3 bg-white hover:bg-slate-50/50 border border-dashed border-slate-200 hover:border-slate-350 rounded-2xl cursor-pointer transition-all shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-455 shrink-0">
                <MoreHorizontal size={16} />
              </span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">More</p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">View all available options</p>
              </div>
            </div>
          </button>
        </div>

        <button className="w-full py-2.5 bg-white hover:bg-indigo-50/30 border border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm select-none mt-4">
          Choose Next Step
        </button>
      </div>
    </div>
  );
};
