import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Tag,
  User,
  CheckSquare,
  FileSpreadsheet,
  MessageSquare,
  Search,
  X
} from 'lucide-react';
import { t } from '../../../../../../../i18n/config';

export interface ActionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
}

interface ActionDefinition {
  type: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  category: string;
  pro?: boolean;
}

export const ActionPickerModal: React.FC<ActionPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  const [selectedCategory, setSelectedCategory] = useState('recently_used');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const allActions: ActionDefinition[] = [
    { type: 'ADD_TAG', title: t('editor.action.add_tag_title'), desc: t('editor.action.add_tag_desc'), icon: <Tag size={18} className="text-amber-500" />, category: 'contact' },
    { type: 'REMOVE_TAG', title: t('editor.action.remove_tag_title'), desc: t('editor.action.remove_tag_desc'), icon: <Tag size={18} className="text-amber-500" />, category: 'contact' },
    { type: 'SET_USER_FIELD', title: t('editor.action.set_field_title'), desc: t('editor.action.set_field_desc'), icon: <User size={18} className="text-sky-500" />, category: 'contact' },
    { type: 'CLEAR_USER_FIELD', title: t('editor.action.clear_field_title'), desc: t('editor.action.clear_field_desc'), icon: <User size={18} className="text-sky-500" />, category: 'contact' },

    { type: 'TELEGRAM_SUBSCRIBE', title: t('editor.action.tg_subscribe_title'), desc: t('editor.action.tg_subscribe_desc'), icon: <CheckSquare size={18} className="text-indigo-500" />, category: 'automation' },
    { type: 'TELEGRAM_UNSUBSCRIBE', title: t('editor.action.tg_unsubscribe_title'), desc: t('editor.action.tg_unsubscribe_desc'), icon: <CheckSquare size={18} className="text-indigo-500" />, category: 'automation' },

    { type: 'GS_INSERT_ROW', title: t('editor.action.gs_insert_title'), desc: t('editor.action.gs_insert_desc'), pro: true, icon: <FileSpreadsheet size={18} className="text-emerald-500" />, category: 'sheets' },
    { type: 'GS_GET_ROW', title: t('editor.action.gs_get_title'), desc: t('editor.action.gs_get_desc'), pro: true, icon: <FileSpreadsheet size={18} className="text-emerald-500" />, category: 'sheets' },
    { type: 'GS_UPDATE_ROW', title: t('editor.action.gs_update_title'), desc: t('editor.action.gs_update_desc'), pro: true, icon: <FileSpreadsheet size={18} className="text-emerald-500" />, category: 'sheets' },

    { type: 'MARK_DONE', title: t('editor.action.mark_done_title'), desc: t('editor.action.mark_done_desc'), icon: <MessageSquare size={18} className="text-emerald-500" />, category: 'live_chat' },
    { type: 'ASSIGN_AGENT', title: t('editor.action.assign_agent_title'), desc: t('editor.action.assign_agent_desc'), icon: <User size={18} className="text-blue-500" />, category: 'live_chat' },
  ];

  const filteredActions = allActions.filter(
    (act) =>
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (type: string) => {
    onSelectAction(type);
    onClose();
    setSearchQuery('');
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
  };

  const categories = [
    { id: 'recently_used', name: t('editor.action.categories.recently_used') },
    { id: 'contact', name: t('editor.action.categories.contact') },
    { id: 'automation', name: t('editor.action.categories.automation') },
    { id: 'live_chat', name: t('editor.action.categories.live_chat') },
    { id: 'sheets', name: t('editor.action.categories.sheets') },
  ];

  const renderActionList = (actionsToRender: ActionDefinition[]) => (
    <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-150">
      {actionsToRender.map((act) => (
        <button
          key={act.type}
          onClick={() => handleSelect(act.type)}
          className="w-full text-left p-4 border-2 border-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-2xl transition-all cursor-pointer flex gap-3.5 items-center group bg-white text-[#0A0A0A]"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 border-2 border-[#0A0A0A] flex items-center justify-center shrink-0 text-[#0A0A0A]">
            {act.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black group-hover:text-[#F2EBDD] transition-colors font-['Anybody',sans-serif]">
                {act.title}
              </h4>
              {act.pro && (
                <span className="text-[8px] font-black bg-amber-300 text-[#0A0A0A] border border-[#0A0A0A] px-1.5 py-0.5 rounded uppercase tracking-wider">
                  PRO
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#0A0A0A]/70 group-hover:text-[#F2EBDD]/80 font-bold mt-0.5">
              {act.desc}
            </p>
          </div>
        </button>
      ))}
    </div>
  );

  return createPortal(
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0A0A0A]/40 p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-2xl w-full max-w-[800px] h-[600px] flex overflow-hidden animate-in zoom-in-95 duration-200 relative font-['JetBrains_Mono',monospace] text-[#0A0A0A]"
      >
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 p-2 bg-[#F2EBDD] hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-[#0A0A0A] rounded-xl text-[#0A0A0A] transition-all cursor-pointer z-50"
        >
          <X size={16} />
        </button>

        <div className="w-[210px] border-r-2 border-[#0A0A0A] bg-[#F2EBDD] p-5 flex flex-col gap-1.5 select-none shrink-0">
          <h2 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider mb-3 mt-4 leading-snug font-['Anybody',sans-serif]">
            {t('editor.action.perform_actions')}
          </h2>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSearchQuery('');
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${
                selectedCategory === cat.id && !searchQuery
                  ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]'
                  : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          <div className="flex flex-col gap-3 mr-12">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]/40" size={16} />
              <input
                type="text"
                placeholder={t('editor.action.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-[#0A0A0A] focus:outline-none text-xs font-bold bg-white text-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
              />
            </div>
          </div>

          {searchQuery ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
                  {t('editor.action.search_results_title')}
                </h3>
                <p className="text-[10px] text-[#0A0A0A]/70 font-bold mt-0.5">
                  {t('editor.action.search_results_desc', { count: filteredActions.length })}
                </p>
              </div>
              {renderActionList(filteredActions)}
            </div>
          ) : (
            <>
              {selectedCategory === 'recently_used' && (
                <div className="space-y-3.5">
                  <div>
                    <h3 className="text-xs font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
                      {t('editor.action.categories.recently_used')}
                    </h3>
                    <p className="text-[10px] text-[#0A0A0A]/70 font-bold mt-0.5">
                      {t('editor.action.recently_used_desc')}
                    </p>
                  </div>
                  {renderActionList(allActions.filter((a) => a.type === 'ADD_TAG' || a.type === 'GS_INSERT_ROW'))}
                </div>
              )}

              {selectedCategory === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {t('editor.action.contact_data_title')}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {t('editor.action.contact_data_desc')}
                    </p>
                  </div>
                  {renderActionList(allActions.filter((a) => a.category === 'contact'))}
                </div>
              )}

              {selectedCategory === 'automation' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {t('editor.action.automation_title')}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {t('editor.action.automation_desc')}
                    </p>
                  </div>
                  {renderActionList(allActions.filter((a) => a.category === 'automation'))}
                </div>
              )}

              {selectedCategory === 'live_chat' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {t('editor.action.live_chat_title')}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {t('editor.action.live_chat_desc')}
                    </p>
                  </div>
                  {renderActionList(allActions.filter((a) => a.category === 'live_chat'))}
                </div>
              )}

              {selectedCategory === 'sheets' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">
                      {t('editor.action.google_sheets_title')}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {t('editor.action.google_sheets_desc')}
                    </p>
                  </div>
                  {renderActionList(allActions.filter((a) => a.category === 'sheets'))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
