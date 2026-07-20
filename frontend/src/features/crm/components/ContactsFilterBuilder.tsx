import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Search, Tag, User, Phone, Mail, Hash, Clock, Pause, Send, Sparkles } from 'lucide-react';
import { getLanguage } from '../../../i18n';

export interface FilterCondition {
  id: string;
  field: string;
  label: string;
  operator: 'is' | 'is_not' | 'contains' | 'doesn\'t contain' | 'begins with' | 'has any value' | 'is unknown' | 'after' | 'before';
  value: string;
}

interface ContactsFilterBuilderProps {
  isOpen: boolean;
  conditions: FilterCondition[];
  setConditions: React.Dispatch<React.SetStateAction<FilterCondition[]>>;
  tags: { id: number; name: string }[];
  contacts: any[];
  botId: number;
}

export const ContactsFilterBuilder: React.FC<ContactsFilterBuilderProps> = ({
  isOpen,
  conditions,
  setConditions,
  tags,
  contacts,
  botId,
}) => {
  const isUk = getLanguage() === 'uk';
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'system' | 'custom'>('system');
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);

  const addDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setIsAddDropdownOpen(false);
      }
    };
    if (isAddDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isAddDropdownOpen]);

  const allCustomFields = useMemo(() => {
    const fieldsSet = new Set<string>();

    if (botId) {
      const storedFields = localStorage.getItem(`launchly_custom_fields_${botId}`);
      if (storedFields) {
        try {
          const parsed = JSON.parse(storedFields);
          if (Array.isArray(parsed)) {
            parsed.forEach((f: any) => {
              if (f && f.name) fieldsSet.add(f.name);
            });
          }
        } catch {}
      }
    }

    contacts.forEach((c) => {
      try {
        const meta = c.metadata ? JSON.parse(c.metadata) : {};
        if (meta.customFields) {
          Object.keys(meta.customFields).forEach((k) => fieldsSet.add(k));
        }
      } catch {}
    });

    return Array.from(fieldsSet);
  }, [botId, contacts]);

  const filteredItems = useMemo(() => {
    const q = dropdownSearch.toLowerCase().trim();

    if (selectedCategory === 'general') {
      const items = [
        { type: 'tag', label: isUk ? 'Тег' : 'Tag', field: 'tag', icon: Tag },
        { type: 'paused', label: isUk ? 'Призупинити автоматизації назавжди' : 'Paused Automations Forever', field: 'paused', icon: Pause },
      ];
      return items.filter((i) => i.label.toLowerCase().includes(q));
    }

    if (selectedCategory === 'system') {
      const items = [
        { type: 'system', label: isUk ? "Ім'я" : 'First Name', field: 'firstName', icon: User },
        { type: 'system', label: isUk ? 'Прізвище' : 'Last Name', field: 'lastName', icon: User },
        { type: 'system', label: isUk ? 'Повне ім\'я' : 'Full Name', field: 'fullName', icon: User },
        { type: 'system', label: 'Email', field: 'email', icon: Mail },
        { type: 'system', label: isUk ? 'Телефон' : 'Phone', field: 'phone', icon: Phone },
        { type: 'system', label: isUk ? 'Дата підписки' : 'Subscribed', field: 'createdAt', icon: Clock },
        { type: 'system', label: 'Contact ID', field: 'id', icon: Hash },
        { type: 'system', label: 'Telegram User ID', field: 'telegramUserId', icon: Hash },
        { type: 'system', label: 'Telegram Username', field: 'telegramUsername', icon: Send },
      ];
      return items.filter((i) => i.label.toLowerCase().includes(q));
    }

    if (selectedCategory === 'custom') {
      return allCustomFields
        .filter((f) => f.toLowerCase().includes(q))
        .map((f) => ({
          type: 'custom',
          label: f,
          field: `custom:${f}`,
          icon: Sparkles,
        }));
    }

    return [];
  }, [selectedCategory, dropdownSearch, allCustomFields, isUk]);

  const handleAddCondition = (item: { field: string; label: string; type: string }) => {
    setIsAddDropdownOpen(false);
    setDropdownSearch('');

    const isDate = item.field === 'createdAt';
    const isPaused = item.field === 'paused' || item.field === 'optedInTelegram';

    const newCond: FilterCondition = {
      id: Math.random().toString(36).substring(2, 9),
      field: item.field,
      label: item.label,
      operator: isDate ? 'after' : 'is',
      value: isPaused ? 'true' : isDate ? new Date().toISOString().split('T')[0] : '',
    };

    setConditions((prev) => [...prev, newCond]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const getOperatorLabel = (op: string) => {
    switch (op) {
      case 'is':
        return 'is';
      case 'is_not':
        return 'isn\'t';
      case 'contains':
        return 'contains';
      case 'doesn\'t contain':
        return 'doesn\'t contain';
      case 'begins with':
        return 'begins with';
      case 'has any value':
        return 'has any value';
      case 'is unknown':
        return 'is unknown';
      case 'after':
        return isUk ? 'після' : 'after';
      case 'before':
        return isUk ? 'до' : 'before';
      default:
        return op;
    }
  };

  const getSuggestionsForField = (field: string, searchVal: string) => {
    const values = new Set<string>();
    contacts.forEach((c) => {
      let val = '';
      let meta: any = {};
      try {
        meta = c.metadata ? JSON.parse(c.metadata) : {};
      } catch {}

      if (field === 'firstName') val = c.firstName;
      else if (field === 'lastName') val = c.lastName;
      else if (field === 'fullName') val = `${c.firstName || ''} ${c.lastName || ''}`;
      else if (field === 'email') val = meta.email || meta.customFields?.Email || meta.customFields?.email;
      else if (field === 'phone') val = meta.phone || meta.customFields?.Phone || meta.customFields?.phone;
      else if (field === 'id') val = String(c.id);
      else if (field === 'telegramUserId') val = String(c.telegramId);
      else if (field === 'telegramUsername') val = c.username;
      else if (field.startsWith('custom:')) {
        const customKey = field.substring(7);
        val = meta.customFields?.[customKey];
      }

      if (val && val.trim() !== '') {
        values.add(val.trim());
      }
    });

    const list = Array.from(values);
    if (!searchVal.trim()) return list.slice(0, 5);
    return list
      .filter((v) => v.toLowerCase().includes(searchVal.toLowerCase().trim()))
      .slice(0, 5);
  };

  if (!isOpen) return null;

  return (
    <div className="px-6 py-4 bg-white border-b border-slate-100 select-none animation-slide-in flex items-center justify-between gap-3 shrink-0 flex-wrap">
      <div className="flex flex-wrap items-center gap-2">
        {conditions.length > 0 && (
          <div className="text-[11px] font-bold text-slate-500 mr-2 flex items-center gap-1">
            <span>{isUk ? 'Тільки контакти, що відповідають' : 'Only contacts, that match'}</span>
            <span className="underline decoration-slate-300 underline-offset-2 font-extrabold text-slate-700">
              {isUk ? 'усім наступним умовам:' : 'all of the following conditions:'}
            </span>
          </div>
        )}

        {conditions.map((cond) => {
          const isDate = cond.field === 'createdAt';
          const isPaused = cond.field === 'paused' || cond.field === 'optedInTelegram';
          const isTag = cond.field === 'tag';

          const operatorsList: FilterCondition['operator'][] = isDate
            ? ['after', 'before', 'is']
            : isPaused || isTag
            ? ['is', 'is_not']
            : ['is', 'is_not', 'has any value', 'contains', 'doesn\'t contain', 'begins with', 'is unknown'];

          return (
            <div
              key={cond.id}
              className="bg-white border border-slate-200 shadow-xs px-3 py-2 rounded-2xl flex items-center gap-2 relative animate-in zoom-in-95 duration-100 select-none"
            >
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                {cond.label}
              </span>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setActivePopoverId(activePopoverId === cond.id ? null : cond.id);
                  }}
                  className="flex items-center gap-1.5 text-xs select-none"
                >
                  <span className="text-[#D9534F] hover:text-[#C9302C] font-semibold border-b border-dashed border-[#D9534F]/40 pb-0.5">
                    {getOperatorLabel(cond.operator)}
                  </span>
                  {cond.operator !== 'has any value' && cond.operator !== 'is unknown' && (
                    <span className="text-slate-700 hover:text-indigo-650 font-bold border-b border-dashed border-slate-300 pb-0.5 truncate max-w-28">
                      {isPaused
                        ? cond.value === 'true'
                          ? isUk
                            ? 'Так'
                            : 'Yes'
                          : isUk
                          ? 'Ні'
                          : 'No'
                        : cond.value || (isUk ? 'Оберіть...' : 'Select...')}
                    </span>
                  )}
                </button>

                {activePopoverId === cond.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30 bg-transparent cursor-default"
                      onClick={() => setActivePopoverId(null)}
                    />
                    <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl flex z-40 overflow-hidden animate-in fade-in duration-100">
                      <div className="w-[140px] bg-slate-50/50 border-r border-slate-100 p-2 flex flex-col gap-0.5 shrink-0">
                        {operatorsList.map((op) => (
                          <button
                            key={op}
                            type="button"
                            onClick={() => {
                              setConditions((prev) =>
                                prev.map((c) => (c.id === cond.id ? { ...c, operator: op } : c))
                              );
                              if (op === 'has any value' || op === 'is unknown') {
                                setConditions((prev) =>
                                  prev.map((c) => (c.id === cond.id ? { ...c, value: '' } : c))
                                );
                                setActivePopoverId(null);
                              }
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                              cond.operator === op
                                ? 'text-indigo-600 bg-indigo-50/75'
                                : 'text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            {getOperatorLabel(op)}
                          </button>
                        ))}
                      </div>

                      {cond.operator !== 'has any value' && cond.operator !== 'is unknown' && (
                        <div className="w-[180px] p-3 flex flex-col gap-2 bg-white shrink-0">
                          {isPaused ? (
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setConditions((prev) =>
                                    prev.map((c) => (c.id === cond.id ? { ...c, value: 'true' } : c))
                                  );
                                  setActivePopoverId(null);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                                  cond.value === 'true'
                                    ? 'bg-indigo-50/60 text-indigo-600 font-bold'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {isUk ? 'Так' : 'Yes'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConditions((prev) =>
                                    prev.map((c) => (c.id === cond.id ? { ...c, value: 'false' } : c))
                                  );
                                  setActivePopoverId(null);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                                  cond.value === 'false'
                                    ? 'bg-indigo-50/60 text-indigo-600 font-bold'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {isUk ? 'Ні' : 'No'}
                              </button>
                            </div>
                          ) : isTag ? (
                            <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto custom-scrollbar">
                              {tags.map((t) => (
                                <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => {
                                    setConditions((prev) =>
                                      prev.map((c) => (c.id === cond.id ? { ...c, value: t.name } : c))
                                    );
                                    setActivePopoverId(null);
                                  }}
                                  className={`w-full text-left px-2 py-1 text-xs font-bold rounded-lg cursor-pointer truncate ${
                                    cond.value === t.name ? 'bg-indigo-50/60 text-indigo-600' : 'hover:bg-slate-50'
                                  }`}
                                >
                                  {t.name}
                                </button>
                              ))}
                            </div>
                          ) : isDate ? (
                            <input
                              type="date"
                              value={cond.value}
                              onChange={(e) => {
                                setConditions((prev) =>
                                  prev.map((c) => (c.id === cond.id ? { ...c, value: e.target.value } : c))
                                );
                              }}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-400 bg-white"
                            />
                          ) : (
                            <>
                              <input
                                type="text"
                                placeholder={isUk ? 'Введіть текст' : 'Enter text'}
                                value={cond.value}
                                onChange={(e) => {
                                  setConditions((prev) =>
                                    prev.map((c) => (c.id === cond.id ? { ...c, value: e.target.value } : c))
                                  );
                                }}
                                className="w-full px-2.5 py-1.5 border border-indigo-400 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white font-semibold text-slate-800"
                              />
                              <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto custom-scrollbar">
                                {getSuggestionsForField(cond.field, cond.value).map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => {
                                      setConditions((prev) =>
                                        prev.map((c) => (c.id === cond.id ? { ...c, value: s } : c))
                                      );
                                      setActivePopoverId(null);
                                    }}
                                    className="w-full text-left px-2 py-1 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg cursor-pointer truncate"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRemoveCondition(cond.id)}
                className="text-slate-350 hover:text-rose-500 hover:bg-rose-50 p-0.5 rounded transition-all cursor-pointer shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}

        <div className="relative" ref={addDropdownRef}>
          <button
            type="button"
            onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-250 border-dashed rounded-xl text-xs font-extrabold text-slate-600 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={14} className="text-slate-400" />
            <span>{isUk ? 'Умова' : 'Condition'}</span>
          </button>

          {isAddDropdownOpen && (
            <div className="absolute left-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl flex z-40 overflow-hidden w-96 max-h-[300px] select-none animation-slide-in">
              <div className="w-[140px] bg-slate-50/50 border-r border-slate-100 p-1.5 flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('system')}
                  className={`w-full text-left px-2.5 py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                    selectedCategory === 'system'
                      ? 'text-indigo-600 bg-indigo-50/65'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {isUk ? 'Системні' : 'System Fields'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('custom')}
                  className={`w-full text-left px-2.5 py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                    selectedCategory === 'custom'
                      ? 'text-indigo-600 bg-indigo-50/65'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {isUk ? 'Користувацькі' : 'Custom User Fields'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('general')}
                  className={`w-full text-left px-2.5 py-2 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                    selectedCategory === 'general'
                      ? 'text-indigo-600 bg-indigo-50/65'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {isUk ? 'Теги та інше' : 'Tags & general'}
                </button>
              </div>

              <div className="flex-1 flex flex-col min-w-0">
                <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-white shrink-0">
                  <Search size={12} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder={isUk ? 'Пошук...' : 'Search...'}
                    value={dropdownSearch}
                    onChange={(e) => setDropdownSearch(e.target.value)}
                    className="w-full text-xs focus:outline-none"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 flex flex-col gap-0.5 custom-scrollbar">
                  {filteredItems.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddCondition(item)}
                        className="w-full text-left px-2.5 py-2 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Icon size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      {isUk ? 'Нічого не знайдено' : 'No fields found'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
