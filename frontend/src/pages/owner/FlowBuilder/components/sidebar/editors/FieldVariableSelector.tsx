import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useClickOutside } from '../../../../../../hooks/useClickOutside';
import { createPortal } from 'react-dom';
import { t } from '../../../../../../i18n/config';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useCustomFieldsData } from '../../../../../../hooks/bot/useCustomFieldsData';
import { FieldModal } from '../../userFields/FieldModal';
import type { UserField } from '../../../../../../types/bot';
import {
  User,
  Phone,
  Clock,
  Hash,
  MessageSquare,
  Send,
  CheckSquare,
  Tag as TagIcon,
  Search,
  Plus,
  Sparkles,
  X
} from 'lucide-react';

import type { TagResponse } from '../../../../../../types/broadcast';

export interface NodeVariableItem {
  key: string;
  name: string;
  val: string;
  icon?: React.ReactNode;
}

interface FieldVariableSelectorProps {
  onSelect: (val: string) => void;
  tags?: TagResponse[];
  customFields?: string[];
  extraSystemFields?: Array<{ key: string; name: string; val: string; icon?: React.ReactNode }>;
  nodeVariables?: NodeVariableItem[];
  nodeCategoryLabel?: string;
  onCreateCustomField?: (name: string) => void;
  mode?: 'field' | 'variable'; 
  trigger?: React.ReactNode;
  position?: 'top' | 'bottom';
  className?: string;
}

export const FieldVariableSelector: React.FC<FieldVariableSelectorProps> = ({
  onSelect,
  tags = [],
  customFields = [],
  extraSystemFields,
  nodeVariables,
  nodeCategoryLabel,
  onCreateCustomField,
  mode = 'variable',
  trigger,
  position = 'bottom',
  className
}) => {
  const activeBotId = useBotStore((state) => state?.activeBotId) || 0;
  const { fields: globalFields, createField } = useCustomFieldsData({ botId: activeBotId });
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'node' | 'system' | 'custom' | 'tags'>('system');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      setSelectedCategory('system');
      setSearchQuery('');
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen, nodeVariables]);

  useClickOutside([containerRef, dropdownRef], () => setIsOpen(false), isOpen);

  const isSearching = searchQuery.trim().length > 0;

  const filteredNodeVariables = useMemo(() => {
    if (!nodeVariables) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return nodeVariables;
    return nodeVariables.filter(f => f.name.toLowerCase().includes(q) || f.val.toLowerCase().includes(q) || f.key.toLowerCase().includes(q));
  }, [nodeVariables, searchQuery]);

  const systemFields = useMemo(() => {
    const base = [
      { key: 'first_name', name: t('editor.gs.fields.first_name'), val: 'first_name', icon: <User size={13} className="text-slate-400" /> },
      { key: 'last_name', name: t('editor.gs.fields.last_name'), val: 'last_name', icon: <User size={13} className="text-slate-400" /> },
      { key: 'phone', name: t('editor.gs.fields.phone'), val: 'phone', icon: <Phone size={13} className="text-slate-400" /> },
      { key: 'email', name: t('editor.gs.fields.email'), val: 'email', icon: <User size={13} className="text-slate-400" /> },
      { key: 'contact_id', name: t('editor.gs.fields.contact_id'), val: 'contact_id', icon: <Hash size={13} className="text-slate-400" /> },
      { key: 'subscribed', name: t('editor.gs.fields.subscribed'), val: 'subscribed', icon: <Clock size={13} className="text-slate-400" /> },
      { key: 'last_reply_type', name: t('editor.gs.fields.last_reply_type'), val: 'last_reply_type', icon: <MessageSquare size={13} className="text-slate-400" /> },
      { key: 'telegram_user_id', name: t('editor.gs.fields.tg_id'), val: 'telegram_user_id', icon: <Hash size={13} className="text-slate-400" /> },
      { key: 'telegram_username', name: t('editor.gs.fields.username'), val: 'telegram_username', icon: <Send size={13} className="text-sky-500" /> },
      { key: 'opted_in_telegram', name: t('editor.gs.fields.opted_in_telegram'), val: 'telegram_opt_in', icon: <CheckSquare size={13} className="text-slate-400" /> },
      { key: 'chat_type', name: 'Chat Type', val: 'chat_type', icon: <MessageSquare size={13} className="text-teal-500" /> },
      { key: 'chat_title', name: 'Chat Title', val: 'chat_title', icon: <MessageSquare size={13} className="text-teal-500" /> },
      { key: 'chat_id', name: 'Chat ID', val: 'chat_id', icon: <Hash size={13} className="text-teal-500" /> }
    ];
    if (extraSystemFields && extraSystemFields.length > 0) {
      return [...extraSystemFields, ...base];
    }
    return base;
  }, [extraSystemFields]);

  const filteredSystemFields = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return systemFields;
    return systemFields.filter(f => f.name.toLowerCase().includes(q) || (f.val && f.val.toLowerCase().includes(q)) || f.key.toLowerCase().includes(q));
  }, [systemFields, searchQuery]);

  const allCustomFields = useMemo(() => {
    const list: Array<string | { name: string; id?: string }> = [...customFields];
    if (globalFields && globalFields.length > 0) {
      globalFields.forEach((gf) => {
        if (!list.some((f) => (typeof f === 'string' ? f : f.name) === gf.name)) {
          list.push(gf);
        }
      });
    }
    return list;
  }, [customFields, globalFields]);

  const filteredCustomFields = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allCustomFields;
    return allCustomFields.filter((f: unknown) => {
      const fname = typeof f === 'string' ? f : (f as { name?: string })?.name || '';
      return fname.toLowerCase().includes(q);
    });
  }, [allCustomFields, searchQuery]);

  const filteredTags = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tags;
    return tags.filter(t => t.name.toLowerCase().includes(q));
  }, [tags, searchQuery]);

  const hasSearchResults =
    filteredNodeVariables.length > 0 ||
    filteredSystemFields.length > 0 ||
    filteredCustomFields.length > 0 ||
    (mode === 'variable' && filteredTags.length > 0);

  const handleItemSelect = (fieldName: string, _type: 'system' | 'custom' | 'tag') => {
    onSelect(fieldName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSaveModalField = (fieldData: UserField) => {
    createField(fieldData);
    if (onCreateCustomField) {
      onCreateCustomField(fieldData.name);
    }
    handleItemSelect(fieldData.name, 'custom');
    setIsFieldModalOpen(false);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updateCoords();
    }
    setIsOpen(!isOpen);
  };

  const dropdownStyle = useMemo(() => {
    const left = Math.max(10, coords.left + coords.width - 380);
    const top = position === 'top'
      ? coords.top - 266
      : coords.top + coords.height + 2;
    return {
      position: 'absolute' as const,
      top: `${top}px`,
      left: `${left}px`,
      width: '380px',
      height: '264px',
      zIndex: 99999,
    };
  }, [coords, position]);

  return (
    <div className={className || "relative inline-block text-left"} ref={containerRef}>
      <div onClick={handleTriggerClick} className={className?.includes('w-full') ? 'w-full' : undefined}>
        {trigger || (
          <button
            type="button"
            className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 hover:text-indigo-700 rounded-md transition-all text-[10px] font-extrabold px-1.5 cursor-pointer"
          >
            {"{ }"}
          </button>
        )}
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          onMouseDown={(e) => { e.stopPropagation(); }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-2xl flex overflow-hidden font-['JetBrains_Mono',monospace] text-[#0A0A0A]"
        >
          <div className="w-[145px] bg-[#F2EBDD] border-r-2 border-[#0A0A0A] p-2.5 flex flex-col gap-1 select-none shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('system');
                setSearchQuery('');
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-xl transition-all cursor-pointer border-2 ${
                !isSearching && selectedCategory === 'system' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
              }`}
            >
              {t('editor.gs.system_fields')}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('custom');
                setSearchQuery('');
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-xl transition-all cursor-pointer border-2 ${
                !isSearching && selectedCategory === 'custom' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
              }`}
            >
              {t('editor.gs.custom_fields')}
            </button>
            {mode === 'variable' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('tags');
                  setSearchQuery('');
                }}
                className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-xl transition-all cursor-pointer border-2 ${
                  !isSearching && selectedCategory === 'tags' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
                }`}
              >
                {t('editor.gs.tags')}
              </button>
            )}
            {nodeVariables && nodeVariables.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('node');
                  setSearchQuery('');
                }}
                className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-xl transition-all cursor-pointer border-2 ${
                  !isSearching && selectedCategory === 'node' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
                }`}
              >
                {nodeCategoryLabel || t('editor.gs.node_variables', 'Змінні вузла')}
              </button>
            )}
          </div>

          <div className="flex-1 p-3 flex flex-col h-[264px] bg-[#F2EBDD]">
            <div className="relative mb-2 shrink-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]/40 pointer-events-none" />
              <input
                type="text"
                placeholder={t('editor.gs.search', 'Пошук')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-7 py-1.5 border-2 border-[#0A0A0A] rounded-xl text-[10px] focus:outline-none bg-white text-[#0A0A0A] font-bold placeholder:text-[#0A0A0A]/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-[#0A0A0A]/10 rounded-full text-[#0A0A0A]/60 cursor-pointer"
                >
                  <X size={10} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
              {isSearching ? (
                <>
                  {filteredNodeVariables.length > 0 && (
                    <div className="flex flex-col gap-0.5 pb-1">
                      <div className="text-[9px] font-black uppercase text-[#0A0A0A]/60 px-2 pt-1 pb-0.5 tracking-wider font-['Anybody',sans-serif]">
                        {nodeCategoryLabel || t('editor.gs.node_variables', 'Змінні вузла')}
                      </div>
                      {filteredNodeVariables.map((field) => (
                        <button
                          key={`search-node-${field.key}`}
                          type="button"
                          onClick={() => handleItemSelect(field.val || field.key, 'system')}
                          className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                        >
                          {field.icon}
                          <span className="truncate">{field.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredSystemFields.length > 0 && (
                    <div className="flex flex-col gap-0.5 pb-1">
                      <div className="text-[9px] font-black uppercase text-[#0A0A0A]/60 px-2 pt-1 pb-0.5 tracking-wider font-['Anybody',sans-serif]">
                        {t('editor.gs.system_fields', 'Системні поля')}
                      </div>
                      {filteredSystemFields.map((field) => (
                        <button
                          key={`search-sys-${field.key}`}
                          type="button"
                          onClick={() => handleItemSelect(field.val || field.key, 'system')}
                          className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                        >
                          {field.icon}
                          <span className="truncate">{field.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredCustomFields.length > 0 && (
                    <div className="flex flex-col gap-0.5 pb-1">
                      <div className="text-[9px] font-black uppercase text-[#0A0A0A]/60 px-2 pt-1 pb-0.5 tracking-wider font-['Anybody',sans-serif]">
                        {t('editor.gs.custom_fields', 'Спеціальні поля')}
                      </div>
                      {filteredCustomFields.map((field: unknown, idx: number) => {
                        const fname = typeof field === 'string' ? field : (field as { name: string }).name;
                        return (
                          <button
                            key={`search-custom-${(field as { id?: string }).id || fname || idx}`}
                            type="button"
                            onClick={() => handleItemSelect(fname, 'custom')}
                            className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                          >
                            <Sparkles size={12} className="text-amber-500 shrink-0" />
                            <span className="truncate">{fname}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {mode === 'variable' && filteredTags.length > 0 && (
                    <div className="flex flex-col gap-0.5 pb-1">
                      <div className="text-[9px] font-black uppercase text-[#0A0A0A]/60 px-2 pt-1 pb-0.5 tracking-wider font-['Anybody',sans-serif]">
                        {t('editor.gs.tags', 'Теги')}
                      </div>
                      {filteredTags.map((tag) => (
                        <button
                          key={`search-tag-${tag.id}`}
                          type="button"
                          onClick={() => handleItemSelect(tag.name, 'tag')}
                          className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                        >
                          <TagIcon size={12} className="text-amber-600 shrink-0" />
                          <span className="truncate">{tag.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {!hasSearchResults && (
                    <span className="text-[10px] text-[#0A0A0A]/60 italic text-center py-2 font-bold">
                      {t('editor.gs.not_found', 'Нічого не знайдено')}
                    </span>
                  )}

                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = searchQuery.trim();
                        if (onCreateCustomField) {
                          onCreateCustomField(name);
                        }
                        handleItemSelect(name, 'custom');
                      }}
                      className="w-full px-2.5 py-1.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-black text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors border-2 border-dashed border-[#0A0A0A] mt-1"
                    >
                      <Plus size={12} className="text-indigo-600 shrink-0" />
                      <span className="truncate">Використати "{searchQuery.trim()}"</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {selectedCategory === 'node' && (
                    <>
                      {filteredNodeVariables.map((field) => (
                        <button
                          key={field.key}
                          type="button"
                          onClick={() => handleItemSelect(field.val || field.key, 'system')}
                          className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                        >
                          {field.icon}
                          <span className="truncate">{field.name}</span>
                        </button>
                      ))}
                      {filteredNodeVariables.length === 0 && (
                        <span className="text-[10px] text-[#0A0A0A]/60 italic text-center py-6 font-bold">
                          {t('editor.gs.not_found', 'Нічого не знайдено')}
                        </span>
                      )}
                    </>
                  )}

                  {selectedCategory === 'system' && (
                    <>
                      {filteredSystemFields.map((field) => (
                        <button
                          key={field.key}
                          type="button"
                          onClick={() => handleItemSelect(field.val || field.key, 'system')}
                          className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                        >
                          {field.icon}
                          <span className="truncate">{field.name}</span>
                        </button>
                      ))}
                      {filteredSystemFields.length === 0 && (
                        <span className="text-[10px] text-[#0A0A0A]/60 italic text-center py-6 font-bold">
                          {t('editor.gs.not_found', 'Нічого не знайдено')}
                        </span>
                      )}
                    </>
                  )}

                  {selectedCategory === 'custom' && (
                    <>
                      <div className="mb-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFieldModalOpen(true);
                            setIsOpen(false);
                          }}
                          className="w-full px-2.5 py-2 bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-[#F2EBDD] rounded-xl text-left text-[10px] font-black flex items-center gap-1.5 cursor-pointer transition-all uppercase font-['Anybody',sans-serif] shadow-xs"
                        >
                          <Plus size={12} />
                          <span>{t('settings.fields.create_field_title', 'Створити поле користувача')}</span>
                        </button>
                      </div>

                      {filteredCustomFields.map((field: unknown, idx: number) => {
                        const fname = typeof field === 'string' ? field : (field as { name: string }).name;
                        return (
                          <button
                            key={(field as { id?: string }).id || fname || idx}
                            type="button"
                            onClick={() => handleItemSelect(fname, 'custom')}
                            className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                          >
                            <Sparkles size={12} className="text-amber-500 shrink-0" />
                            <span className="truncate">{fname}</span>
                          </button>
                        );
                      })}
                      {filteredCustomFields.length === 0 && (
                        <span className="text-[10px] text-[#0A0A0A]/60 italic text-center py-6 font-bold">
                          {t('crm.panel.fields.no_fields', 'Немає полів')}
                        </span>
                      )}
                    </>
                  )}

                  {selectedCategory === 'tags' && mode === 'variable' && (
                    <>
                      {filteredTags.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleItemSelect(tag.name, 'tag')}
                          className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                        >
                          <TagIcon size={12} className="text-amber-600 shrink-0" />
                          <span className="truncate">{tag.name}</span>
                        </button>
                      ))}
                      {filteredTags.length === 0 && (
                        <span className="text-[10px] text-[#0A0A0A]/60 italic text-center py-6 font-bold">
                          {t('crm.panel.tags.no_tags')}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <FieldModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        onSave={handleSaveModalField}
      />
    </div>
  );
};
