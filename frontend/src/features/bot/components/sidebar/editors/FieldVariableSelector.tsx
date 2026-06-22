import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Type,
  X
} from 'lucide-react';

interface Tag {
  id: number;
  name: string;
  botId?: number;
}

interface FieldVariableSelectorProps {
  onSelect: (val: string) => void;
  tags?: Tag[];
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
    { key: 'first_name', name: 'First Name', val: 'first_name', icon: <User size={13} className="text-slate-400" /> },
    { key: 'last_name', name: 'Last Name', val: 'last_name', icon: <User size={13} className="text-slate-400" /> },
    { key: 'phone', name: 'Phone', val: 'phone', icon: <Phone size={13} className="text-slate-400" /> },
    { key: 'email', name: 'Email', val: 'email', icon: <User size={13} className="text-slate-400" /> },
    { key: 'contact_id', name: 'Contact Id', val: 'contact_id', icon: <Hash size={13} className="text-slate-400" /> },
    { key: 'subscribed', name: 'Subscribed', val: 'subscribed', icon: <Clock size={13} className="text-slate-400" /> },
    { key: 'last_reply_type', name: 'Last Reply Type', val: 'last_reply_type', icon: <MessageSquare size={13} className="text-slate-400" /> },
    { key: 'telegram_user_id', name: 'Telegram User ID', val: 'telegram_user_id', icon: <Hash size={13} className="text-slate-400" /> },
    { key: 'telegram_username', name: 'Telegram Username', val: 'telegram_username', icon: <Send size={13} className="text-sky-500" /> },
    { key: 'opted_in_telegram', name: 'Opted-in for Telegram', val: 'telegram_opt_in', icon: <CheckSquare size={13} className="text-slate-400" /> }
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
          className="bg-white border border-slate-200 rounded-2xl shadow-xl flex overflow-hidden"
        >
          
          <div className="w-[140px] bg-slate-50 border-r border-slate-100 p-2.5 flex flex-col gap-1 select-none">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('system');
                setSearchQuery('');
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedCategory === 'system' ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50' : 'text-slate-650 hover:bg-slate-200/50'
              }`}
            >
              System Fields
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('custom');
                setSearchQuery('');
              }}
              className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                selectedCategory === 'custom' ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50' : 'text-slate-650 hover:bg-slate-200/50'
              }`}
            >
              Custom User Fields
            </button>
            {mode === 'variable' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('tags');
                  setSearchQuery('');
                }}
                className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  selectedCategory === 'tags' ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/50' : 'text-slate-650 hover:bg-slate-200/50'
                }`}
              >
                Tags
              </button>
            )}
          </div>

          
          <div className="flex-1 p-3 flex flex-col h-[240px]">
            
            <div className="relative mb-2 shrink-0">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-indigo-400 bg-slate-50/20 font-semibold"
              />
            </div>

            
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
              
              {selectedCategory === 'system' && (
                <>
                  {filteredSystemFields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => handleItemSelect(field.name, 'system')}
                      className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left text-[11px] font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      {field.icon}
                      <span>{field.name}</span>
                    </button>
                  ))}
                  {filteredSystemFields.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic text-center py-6 font-medium">No fields found</span>
                  )}
                </>
              )}

              
              {selectedCategory === 'custom' && (
                <>
                  
                  {onCreateCustomField && (
                    <div className="mb-1">
                      {!showCreateFieldInput ? (
                        <button
                          type="button"
                          onClick={() => setShowCreateFieldInput(true)}
                          className="w-full px-2.5 py-1.5 bg-indigo-50/50 hover:bg-indigo-50 border border-dashed border-indigo-200 text-indigo-700 rounded-lg text-left text-[10px] font-extrabold flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus size={12} />
                          <span>Create Custom Field</span>
                        </button>
                      ) : (
                        <form onSubmit={handleCreateField} className="flex gap-1.5 items-center">
                          <input
                            type="text"
                            required
                            placeholder="Field key (e.g. Рыба)"
                            autoFocus
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border border-indigo-300 rounded-lg text-[10px] focus:outline-none bg-white font-bold"
                          />
                          <button
                            type="submit"
                            className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCreateFieldInput(false)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </form>
                      )}
                    </div>
                  )}

                  {filteredCustomFields.map((field) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => handleItemSelect(field, 'custom')}
                      className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left text-[11px] font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Type size={13} className="text-sky-500" />
                      <span>{field}</span>
                    </button>
                  ))}
                  {filteredCustomFields.length === 0 && !showCreateFieldInput && (
                    <span className="text-[10px] text-slate-400 italic text-center py-6 font-medium">No custom fields</span>
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
                      className="w-full px-2.5 py-1.5 hover:bg-slate-50 rounded-lg text-left text-[11px] font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <TagIcon size={12} className="text-amber-500" />
                      <span className="truncate">{tag.name}</span>
                    </button>
                  ))}
                  {filteredTags.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic text-center py-6 font-medium">No tags found</span>
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
