import React, { useState } from 'react';
import { X, Tag, Pause, Play, Bookmark, Lock, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../i18n/config';

interface BulkActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: string;
  selectedCount: number;
  tags: { id: number; name: string; botId: number }[];
  onApply: (value: string) => void;
}

export const BulkActionModal: React.FC<BulkActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
  selectedCount,
  tags,
  onApply,
}) => {
  const { t } = useTranslation();
  const [selectedTag, setSelectedTag] = useState('');
  const [newTagVal, setNewTagVal] = useState('');
  const [customFieldKey, setCustomFieldKey] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [clearFieldKey, setClearFieldKey] = useState('');

  if (!isOpen) return null;

  const getActionDetails = () => {
    switch (actionType) {
      case 'add-tag':
        return {
          title: t('crm.contacts.bulk.add_tag'),
          icon: <Tag size={18} className="text-indigo-500" />,
          btnText: t('crm.contacts.bulk.btn_apply'),
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-100',
        };
      case 'remove-tag':
        return {
          title: t('crm.contacts.bulk.remove_tag'),
          icon: <Tag size={18} className="text-rose-500" />,
          btnText: t('crm.contacts.bulk.delete'),
          btnBg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-rose-100',
        };
      case 'pause':
        return {
          title: t('crm.contacts.bulk.pause_title'),
          icon: <Pause size={18} className="text-amber-500" />,
          btnText: t('crm.contacts.bulk.pause'),
          btnBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 shadow-amber-100',
        };
      case 'resume':
        return {
          title: t('crm.contacts.bulk.resume'),
          icon: <Play size={18} className="text-emerald-500" />,
          btnText: t('crm.contacts.bulk.resume'),
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 shadow-emerald-100',
        };
      case 'set-field':
        return {
          title: t('crm.contacts.bulk.set_field'),
          icon: <Bookmark size={18} className="text-indigo-500" />,
          btnText: t('crm.contacts.bulk.btn_apply'),
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 shadow-indigo-100',
        };
      case 'clear-field':
        return {
          title: t('crm.contacts.bulk.clear_field'),
          icon: <Bookmark size={18} className="text-rose-500" />,
          btnText: t('crm.contacts.bulk.clear_field'),
          btnBg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-rose-100',
        };
      case 'unsub-acc':
        return {
          title: t('crm.contacts.bulk.unsub_acc'),
          icon: <Lock size={18} className="text-amber-500" />,
          btnText: t('crm.contact.unsubscribe'),
          btnBg: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 shadow-amber-100',
        };
      case 'delete':
        return {
          title: t('crm.contacts.bulk.delete_title'),
          icon: <Trash2 size={18} className="text-rose-500" />,
          btnText: t('crm.contacts.bulk.delete'),
          btnBg: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 shadow-rose-100',
        };
      default:
        return {
          title: 'Bulk Action',
          icon: <Tag size={18} />,
          btnText: 'Confirm',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700',
        };
    }
  };

  const details = getActionDetails();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let value = '';

    if (actionType === 'add-tag') {
      value = selectedTag === 'NEW_TAG' ? newTagVal.trim() : selectedTag;
      if (!value) return;
    } else if (actionType === 'remove-tag') {
      value = selectedTag;
      if (!value) return;
    } else if (actionType === 'set-field') {
      if (!customFieldKey.trim()) return;
      value = `${customFieldKey.trim()}:${customFieldValue.trim()}`;
    } else if (actionType === 'clear-field') {
      if (!clearFieldKey.trim()) return;
      value = clearFieldKey.trim();
    }

    onApply(value);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 cursor-default animate-fade-in"
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2 select-none">
            {details.icon}
            {details.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider select-none">
            {t('crm.contacts.bulk.selected_contacts_count', `Selected contacts: ${selectedCount}`)}
          </div>

          {actionType === 'add-tag' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {t('crm.contacts.bulk.select_tag_label')}
                </label>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="">{t('crm.contacts.bulk.select_tag')}</option>
                  {tags.map((tItem) => (
                    <option key={tItem.id} value={tItem.name}>
                      {tItem.name}
                    </option>
                  ))}
                  <option value="NEW_TAG">
                    {t('crm.contacts.bulk.new_tag_option')}
                  </option>
                </select>
              </div>

              {selectedTag === 'NEW_TAG' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    {t('crm.contacts.bulk.new_tag_name_label')}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('crm.contacts.bulk.enter_tag')}
                    value={newTagVal}
                    onChange={(e) => setNewTagVal(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
                  />
                </div>
              )}
            </div>
          )}

          {actionType === 'remove-tag' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {t('crm.contacts.bulk.select_tag_remove')}
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700 cursor-pointer"
              >
                <option value="">{t('crm.contacts.bulk.select_tag')}</option>
                {tags.map((tItem) => (
                  <option key={tItem.id} value={tItem.name}>
                    {tItem.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {actionType === 'set-field' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {t('crm.contacts.bulk.field_name_label')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('crm.contacts.bulk.field_name_placeholder')}
                  value={customFieldKey}
                  onChange={(e) => setCustomFieldKey(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  {t('crm.contacts.bulk.field_value_label')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('crm.contacts.bulk.field_value_placeholder')}
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
                />
              </div>
            </div>
          )}

          {actionType === 'clear-field' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                {t('crm.contacts.bulk.field_clear_label')}
              </label>
              <input
                type="text"
                required
                placeholder={t('crm.contacts.bulk.field_clear_placeholder')}
                value={clearFieldKey}
                onChange={(e) => setClearFieldKey(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-semibold text-slate-700"
              />
            </div>
          )}

          {['pause', 'resume', 'unsub-acc', 'delete'].includes(actionType) && (
            <div className="text-slate-600 font-semibold text-xs leading-relaxed select-none">
              {actionType === 'pause' && t('crm.contacts.bulk.confirm_pause')}
              {actionType === 'resume' && t('crm.contacts.bulk.confirm_resume')}
              {actionType === 'unsub-acc' && t('crm.contacts.bulk.confirm_unsub')}
              {actionType === 'delete' && t('crm.contacts.bulk.confirm_delete')}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {t('crm.contacts.bulk.btn_cancel')}
            </button>
            <button
              type="submit"
              className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm cursor-pointer ${details.btnBg}`}
            >
              {details.btnText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
