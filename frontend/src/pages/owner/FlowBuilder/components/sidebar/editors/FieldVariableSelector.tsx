import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../../../../../../i18n/config';
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
  Check,
  Sparkles
} from 'lucide-react';

import type { TagResponse } from '../../../../../../types/broadcast';

interface FieldVariableSelectorProps {
  onSelect: (val: string) => void;
  tags?: TagResponse[];
  customFields?: string[];
  onCreateCustomField?: (name: string) => void;
  mode?: 'field' | 'variable'; 
  trigger?: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const FieldVariableSelector: React.FC<FieldVariableSelectorProps> = ({
  onSelect,
  tags = [],
  customFields = [],
  onCreateCustomField,
  mode = 'variable',
  trigger,
  position = 'bottom'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'system' | 'custom' | 'tags'>('system');
  const [searchQuery, setSearchQuery] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [showCreateFieldInput, setShowCreateFieldInput] = useState(false);
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
      window.addEventListener('resize', updateCoords);
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const systemFields = useMemo(() => [
    { key: 'first_name', name: t('editor.gs.fields.first_name'), val: 'first_name', icon: <User size={13} className="text-slate-400" /> },
    { key: 'last_name', name: t('editor.gs.fields.last_name'), val: 'last_name', icon: <User size={13} className="text-slate-400" /> },
    { key: 'phone', name: t('editor.gs.fields.phone'), val: 'phone', icon: <Phone size={13} className="text-slate-400" /> },
    { key: 'email', name: t('editor.gs.fields.email'), val: 'email', icon: <User size={13} className="text-slate-400" /> },
    { key: 'contact_id', name: t('editor.gs.fields.contact_id'), val: 'contact_id', icon: <Hash size={13} className="text-slate-400" /> },
    { key: 'subscribed', name: t('editor.gs.fields.subscribed'), val: 'subscribed', icon: <Clock size={13} className="text-slate-400" /> },
    { key: 'last_reply_type', name: t('editor.gs.fields.last_reply_type'), val: 'last_reply_type', icon: <MessageSquare size={13} className="text-slate-400" /> },
    { key: 'telegram_user_id', name: t('editor.gs.fields.tg_id'), val: 'telegram_user_id', icon: <Hash size={13} className="text-slate-400" /> },
    { key: 'telegram_username', name: t('editor.gs.fields.username'), val: 'telegram_username', icon: <Send size={13} className="text-sky-500" /> },
    { key: 'opted_in_telegram', name: t('editor.gs.fields.opted_in_telegram'), val: 'telegram_opt_in', icon: <CheckSquare size={13} className="text-slate-400" /> }
  ], []);

  
  const filteredSystemFields = useMemo(() => {
    return systemFields.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [systemFields, searchQuery]);

  const filteredCustomFields = useMemo(() => {
    return customFields.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [customFields, searchQuery]);

  const filteredTags = useMemo(() => {
    return tags.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tags, searchQuery]);

  const handleItemSelect = (fieldName: string, _type: 'system' | 'custom' | 'tag') => {
    
    onSelect(fieldName);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleCreateField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;
    const name = newFieldName.trim();
    if (onCreateCustomField) {
      onCreateCustomField(name);
    }
    handleItemSelect(name, 'custom');
    setNewFieldName('');
    setShowCreateFieldInput(false);
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
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={handleTriggerClick}>
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
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-2xl flex overflow-hidden font-['JetBrains_Mono',monospace] text-[#0A0A0A]"
        >
          {/* Left Category Navigation */}
          <div className="w-[145px] bg-[#F2EBDD] border-r-2 border-[#0A0A0A] p-2.5 flex flex-col gap-1 select-none shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('system');
                setSearchQuery('');
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-xl transition-all cursor-pointer border-2 ${
                selectedCategory === 'system' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
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
                selectedCategory === 'custom' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
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
                  selectedCategory === 'tags' ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]' : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
                }`}
              >
                {t('editor.gs.tags')}
              </button>
            )}
          </div>

          {/* Right Field List */}
          <div className="flex-1 p-3 flex flex-col h-[264px] bg-[#F2EBDD]">
            {/* Search Input */}
            <div className="relative mb-2 shrink-0">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0A0A0A]/40 pointer-events-none" />
              <input
                type="text"
                placeholder={t('common.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border-2 border-[#0A0A0A] rounded-xl text-[10px] focus:outline-none bg-white text-[#0A0A0A] font-bold placeholder:text-[#0A0A0A]/40"
              />
            </div>

            {/* Field List Items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
              {/* System Fields */}
              {selectedCategory === 'system' && (
                <>
                  {filteredSystemFields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => handleItemSelect(field.name, 'system')}
                      className="w-full px-2.5 py-1.5 hover:bg-[#0A0A0A] hover:text-[#F2EBDD] rounded-xl text-left text-[11px] font-bold text-[#0A0A0A] flex items-center gap-2 cursor-pointer transition-colors group"
                    >
                      {field.icon}
                      <span className="truncate">{field.name}</span>
                    </button>
                  ))}
                  {filteredSystemFields.length === 0 && (
                    <span className="text-[10px] text-[#0A0A0A]/60 italic text-center py-6 font-bold">
                      {t('editor.action.no_actions_title')}
                    </span>
                  )}
                </>
              )}

              {/* Custom Fields */}
              {selectedCategory === 'custom' && (
                <>
                  {/* Create New Custom Field Option */}
                  {onCreateCustomField && (
                    <div className="mb-1">
                      {!showCreateFieldInput ? (
                        <button
                          type="button"
                          onClick={() => setShowCreateFieldInput(true)}
                          className="w-full px-2.5 py-1.5 bg-white hover:bg-[#0A0A0A] hover:text-[#F2EBDD] border-2 border-dashed border-[#0A0A0A] text-[#0A0A0A] rounded-xl text-left text-[10px] font-black flex items-center gap-1.5 cursor-pointer transition-all uppercase font-['Anybody',sans-serif]"
                        >
                          <Plus size={12} />
                          <span>{t('settings.fields.create_field_title')}</span>
                        </button>
                      ) : (
                        <form onSubmit={handleCreateField} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            required
                            placeholder={t('settings.fields.placeholder_field_name')}
                            autoFocus
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border-2 border-[#0A0A0A] rounded-xl text-[10px] focus:outline-none bg-white text-[#0A0A0A] font-bold"
                          />
                          <button
                            type="submit"
                            className="px-2.5 py-1.5 bg-[#0A0A0A] text-[#F2EBDD] font-black rounded-xl text-[10px] cursor-pointer border-2 border-[#0A0A0A]"
                          >
                            <Check size={12} />
                          </button>
                        </form>
                      )}
                    </div>
                  )}

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
                  {filteredCustomFields.length === 0 && !showCreateFieldInput && (
                    <span className="text-[10px] text-[#0A0A0A]/60 italic text-center py-6 font-bold">
                      {t('crm.panel.fields.no_fields')}
                    </span>
                  )}
                </>
              )}

              {/* Tags */}
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
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
