import React from 'react';
import { AlertTriangle, Send, Loader2, X } from 'lucide-react';
import type { CreateBroadcastDialogProps } from '../types';

export const CreateBroadcastDialog: React.FC<CreateBroadcastDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  isCreating,
  createError,
  tags,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">New Broadcast Campaign</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-655 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {createError && (
            <div className="bg-rose-50 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold border border-rose-100 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{createError.message}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campaign Name</label>
            <input
              type="text"
              placeholder="e.g. Weekly Promotion Promo Code"
              {...form.register('name')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-rose-600 font-bold">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Audience</label>
            <select
              {...form.register('filterType')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
            >
              <option value="ALL">All Bot Users</option>
              <option value="BY_TAG">Filter by User Tag</option>
              <option value="HAS_ORDERS">Users with Orders</option>
              <option value="HAS_LEADS">Users with Leads</option>
            </select>
          </div>

          {form.watch('filterType') === 'BY_TAG' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Tag</label>
              <select
                {...form.register('filterValue')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
              >
                <option value="">-- Select Tag --</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.name}>
                    {tag.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.filterValue && (
                <p className="text-xs text-rose-600 font-bold">{form.formState.errors.filterValue.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message Text</label>
            <textarea
              rows={4}
              placeholder="Enter broadcast message content..."
              {...form.register('message')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
            {form.formState.errors.message && (
              <p className="text-xs text-rose-600 font-bold">{form.formState.errors.message.message}</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
            >
              {isCreating ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send size={12} />
                  <span>Create Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
