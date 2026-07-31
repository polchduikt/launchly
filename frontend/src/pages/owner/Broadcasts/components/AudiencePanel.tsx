import React, { useState, useMemo } from 'react';
import { UserCheck, ChevronDown, ChevronUp, X, Plus, Search, User, Tag, Sparkles, Phone, Mail, Hash, Clock, Send } from 'lucide-react';
import type { AudienceCondition, TagResponse } from '../../../../types';
import { useBotsQuery } from '../../../../hooks/bot/useBotsQuery';
import { useBotStore } from '../../../../store/useBotStore';
import { useTranslation } from '../../../../i18n/config';

interface AudiencePanelProps {
  isAudienceOpen: boolean;
  setIsAudienceOpen: (open: boolean) => void;
  getAudienceCount: () => number;
  conditions: AudienceCondition[];
  handleRemoveCondition: (id: string) => void;
  isConditionDropdownOpen: boolean;
  setIsConditionDropdownOpen: (open: boolean) => void;
  selectedCategory: 'general' | 'system' | 'custom';
  setSelectedCategory: (cat: 'general' | 'system' | 'custom') => void;
  tags: TagResponse[];
  handleAddTagCondition: (name: string) => void;
  setConditions: React.Dispatch<React.SetStateAction<AudienceCondition[]>>;
  setIsDirty: (dirty: boolean) => void;
  customFields?: string[];
  leads?: unknown[];
  orders?: unknown[];
}

export const AudiencePanel: React.FC<AudiencePanelProps> = ({
  isAudienceOpen,
  setIsAudienceOpen,
  getAudienceCount,
  conditions,
  handleRemoveCondition,
  isConditionDropdownOpen,
  setIsConditionDropdownOpen,
  selectedCategory,
  setSelectedCategory,
  tags,
  handleAddTagCondition: _handleAddTagCondition,
  setConditions,
  setIsDirty,
  customFields = ['last_order_product', 'last_order_price', 'phone', 'email'],
  leads = [],
  orders = [],
}) => {
  const { t } = useTranslation();
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [valSearch, setValSearch] = useState('');

  const { data: bots = [] } = useBotsQuery();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const currentBot = bots.find((b) => b.id === activeBotId);
  const totalUsers = currentBot ? (currentBot.totalUsers ?? 0) : 0;

  const getTagCount = (tagName: string) => {
    let count = 0;
    if (tagName === 'Окунь') count = 1;
    else if (tagName === 'Щука') count = 0;
    else if (tagName === 'Карась') count = 0;
    else {
      count = Math.abs(tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 4;
    }
    return Math.min(count, totalUsers);
  };

  const getFieldValues = (field: string) => {
    switch (field) {
      case 'tag':
        return tags.map((t) => ({
          name: t.name,
          count: getTagCount(t.name)
        }));
      case 'opt_in':
        return [
          { name: 'Widget', count: 3 },
          { name: 'Ad', count: 5 },
          { name: 'API', count: 1 },
          { name: 'Sequence', count: 2 },
          { name: 'Segment', count: 0 }
        ];
      case 'order':
        return [
          { name: 'Any Order', count: orders.length || 4 },
          { name: 'Completed Order', count: 3 },
          { name: 'Pending Order', count: 1 }
        ];
      case 'lead':
        return [
          { name: 'Any Lead', count: leads.length || 7 },
          { name: 'Active Lead', count: 5 },
          { name: 'Won Lead', count: 2 }
        ];
      default:
        return [];
    }
  };

  const filteredItems = useMemo(() => {
    const search = dropdownSearch.toLowerCase().trim();

    if (selectedCategory === 'general') {
      const items = [
        { type: 'tag', label: t('audience.panel.field.tag'), val: '', icon: Tag },
      ];
      return items.filter(i => i.label.toLowerCase().includes(search));
    }

    if (selectedCategory === 'system') {
      const items = [
        { type: 'system', label: t('crm.contact.first_name'), icon: User },
        { type: 'system', label: t('crm.contact.last_name'), icon: User },
        { type: 'system', label: t('editor.gs.fields.username'), icon: User },
        { type: 'system', label: 'Email', icon: Mail },
        { type: 'system', label: t('editor.gs.fields.phone'), icon: Phone },
        { type: 'system', label: t('audience.panel.field.subscribed'), icon: Clock },
        { type: 'system', label: 'Contact ID', icon: Hash },
        { type: 'system', label: 'Telegram User ID', icon: Hash },
        { type: 'system', label: 'Telegram Username', icon: Send },
      ];
      return items.filter(i => i.label.toLowerCase().includes(search));
    }

    if (selectedCategory === 'custom') {
      return customFields
        .filter(f => f.toLowerCase().includes(search))
        .map(f => ({ type: 'custom', label: f, icon: Sparkles }));
    }

    return [];
  }, [selectedCategory, dropdownSearch, tags, customFields]);

  const handleAddConditionItem = (item: { type: string; label: string; val?: string }) => {
    setIsConditionDropdownOpen(false);
    setDropdownSearch('');
    setIsDirty(true);

    const newId = `cond_${Date.now()}`;

    if (item.type === 'tag') {
      setConditions((prev) => [
        ...prev,
        {
          id: newId,
          field: 'tag',
          operator: 'is',
          value: item.val || '',
        },
      ]);
    } else if (item.type === 'opt_in') {
      setConditions((prev) => [
        ...prev,
        {
          id: newId,
          field: 'opt_in',
          operator: 'is',
          value: item.val || '',
        },
      ]);
    } else if (item.type === 'order') {
      setConditions((prev) => [
        ...prev,
        {
          id: newId,
          field: 'order',
          operator: 'is',
          value: 'Any Order',
        },
      ]);
    } else if (item.type === 'lead') {
      setConditions((prev) => [
        ...prev,
        {
          id: newId,
          field: 'lead',
          operator: 'is',
          value: 'Any Lead',
        },
      ]);
    } else if (item.type === 'system') {
      setConditions((prev) => [
        ...prev,
        {
          id: newId,
          field: 'lead',
          operator: 'is',
          value: `System:${item.label}:Select...`,
        },
      ]);
    } else if (item.type === 'custom') {
      setConditions((prev) => [
        ...prev,
        {
          id: newId,
          field: 'lead',
          operator: 'is',
          value: `Field:${item.label}:Select...`,
        },
      ]);
    }

    setActiveDropdownId(newId);
  };

  const getFieldLabel = (field: string, value: string = '') => {
    if (field === 'tag') return t('audience.panel.field.tag');
    if (field === 'opt_in') return t('audience.panel.field.opt_in');
    if (field === 'order') return t('audience.panel.field.order');
    if (field === 'lead') {
      if (value.startsWith('System:')) {
        const parts = value.split(':');
        return parts[1] || t('audience.panel.field.system');
      }
      if (value.startsWith('Field:')) {
        const parts = value.split(':');
        return parts[1] || t('audience.panel.field.custom');
      }
      return t('audience.panel.field.lead');
    }
    return field;
  };

  const getConditionDisplayValue = (cond: AudienceCondition) => {
    const val = cond.value || '';
    if (cond.field === 'lead') {
      if (val.startsWith('System:') || val.startsWith('Field:')) {
        const parts = val.split(':');
        const display = parts[2] || '';
        return display === 'Select...' || display === '' ? t('audience.panel.search_ellipsis') : display;
      }
    }
    return cond.value === 'Select...' || !cond.value ? t('audience.panel.search_ellipsis') : cond.value;
  };

  return (
    <div
      className={`absolute left-0 right-0 z-20 bg-white border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] transition-all duration-300 ease-in-out select-none flex flex-col ${
        isAudienceOpen ? 'top-0 bottom-0' : 'h-14 bottom-0'
      }`}
    >
      {!isAudienceOpen ? (
        <div
          onClick={() => setIsAudienceOpen(true)}
          className="px-6 h-14 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer shrink-0"
        >
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-800">
              {t('audience.panel.target_audience')}
            </span>
            <button className="text-slate-400 mt-0.5">
              <ChevronUp size={15} />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-550 bg-slate-50 border border-slate-200/60 px-3.5 py-1.5 rounded-xl">
            <User size={13} className="text-slate-400" />
            <span>{t('audience.panel.subscribers_receive', { count: getAudienceCount() })}</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            onClick={() => setIsAudienceOpen(false)}
            className="px-6 h-14 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50/40 cursor-pointer shrink-0"
          >
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800">{t('audience.panel.target_audience')}</span>
              <ChevronDown size={15} className="text-slate-400 mt-0.5" />
            </div>

            <div className="flex-1 px-8 text-[11px] font-bold text-slate-700 uppercase tracking-wider text-center pointer-events-none">
              {t('audience.panel.send_matching')}{' '}
              <span className="underline decoration-indigo-500 underline-offset-2 text-indigo-750">
                {t('audience.panel.matching_conditions')}
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 text-indigo-655 font-extrabold bg-indigo-50/70 border border-indigo-100 px-3 py-1 rounded-xl shadow-xs text-xs shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <UserCheck size={13} strokeWidth={2.5} />
              <span>{t('audience.panel.preview_contact', { count: getAudienceCount() })}</span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="w-64 border-r border-slate-100 px-6 py-5 shrink-0">
              <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                {t('audience.panel.targeting_desc')}
              </p>
            </div>

            <div className="flex-1 px-8 py-5 overflow-y-auto custom-scrollbar">
              <div className="flex flex-row flex-wrap gap-2.5 items-center">
                {conditions.map((cond) => {
                  const displayField = getFieldLabel(cond.field, cond.value);
                  const displayOperator = cond.operator === 'is' ? t('audience.panel.operator.is') : t('audience.panel.operator.is_not');
                  const displayValue = getConditionDisplayValue(cond);

                    const allFieldValues = getFieldValues(cond.field);
                    const filteredFieldValues = allFieldValues.filter((v) =>
                      v.name.toLowerCase().includes(valSearch.toLowerCase().trim())
                    );

                    return (
                      <div
                        key={cond.id}
                        className="bg-white border border-slate-200 shadow-xs px-3 py-2 rounded-2xl flex items-center gap-2 relative animate-in zoom-in-95 duration-100 hover:border-slate-350 transition-colors shrink-0"
                      >
                        <span className="text-[11px] font-bold text-slate-500 shrink-0">
                          {displayField}
                        </span>

                        <div className="flex items-center gap-1 text-xs select-none">
                          <button
                            type="button"
                            onClick={() => {
                              const displayVal = getConditionDisplayValue(cond);
                              setValSearch(displayVal === 'Select...' ? '' : displayVal);
                              setActiveDropdownId(activeDropdownId === cond.id ? null : cond.id);
                            }}
                            className="text-[#D9534F] hover:text-[#C9302C] font-semibold cursor-pointer border-b border-dashed border-[#D9534F]/40 pb-0.5"
                          >
                            {displayOperator}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const displayVal = getConditionDisplayValue(cond);
                              setValSearch(displayVal === 'Select...' ? '' : displayVal);
                              setActiveDropdownId(activeDropdownId === cond.id ? null : cond.id);
                            }}
                            className="text-slate-700 hover:text-indigo-655 font-bold cursor-pointer border-b border-dashed border-slate-300 pb-0.5"
                          >
                            {displayValue}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(cond.id)}
                          className="text-slate-350 hover:text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-all cursor-pointer shrink-0"
                        >
                          <X size={13} />
                        </button>

                        {activeDropdownId === cond.id && (
                          <>
                            <div
                              className="fixed inset-0 z-30 bg-transparent cursor-default"
                              onClick={() => setActiveDropdownId(null)}
                            />
                            <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl flex z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                              <div className="w-[85px] bg-slate-50/50 border-r border-slate-100 p-1.5 flex flex-col gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = conditions.map((c) =>
                                      c.id === cond.id ? { ...c, operator: 'is' as const } : c
                                    );
                                    setConditions(updated);
                                    setIsDirty(true);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                                    cond.operator === 'is'
                                      ? 'text-indigo-600 bg-indigo-50/65'
                                      : 'text-slate-655 hover:bg-slate-100'
                                  }`}
                                >
                                  {t('audience.panel.operator.is')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = conditions.map((c) =>
                                      c.id === cond.id ? { ...c, operator: 'is_not' as const } : c
                                    );
                                    setConditions(updated);
                                    setIsDirty(true);
                                    setActiveDropdownId(null);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer ${
                                    cond.operator === 'is_not'
                                      ? 'text-indigo-600 bg-indigo-50/65'
                                      : 'text-slate-655 hover:bg-slate-100'
                                  }`}
                                >
                                  {t('audience.panel.operator.is_not')}
                                </button>
                              </div>

                              {cond.field === 'lead' && (cond.value?.startsWith('System:') || cond.value?.startsWith('Field:')) ? (
                                <div className="w-[200px] p-3 flex flex-col gap-2 shrink-0 bg-white">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    {t('audience.panel.enter_value')}
                                  </span>
                                  <input
                                    type="text"
                                    placeholder={t('audience.panel.type_value')}
                                    value={valSearch}
                                    onChange={(e) => setValSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const prefix = cond.value.startsWith('System:') ? 'System' : 'Field';
                                        const fieldName = getFieldLabel(cond.field, cond.value);
                                        const updated = conditions.map((c) =>
                                          c.id === cond.id
                                            ? { ...c, value: `${prefix}:${fieldName}:${valSearch}` }
                                            : c
                                        );
                                        setConditions(updated);
                                        setIsDirty(true);
                                        setActiveDropdownId(null);
                                      }
                                    }}
                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const prefix = cond.value.startsWith('System:') ? 'System' : 'Field';
                                      const fieldName = getFieldLabel(cond.field, cond.value);
                                      const updated = conditions.map((c) =>
                                        c.id === cond.id
                                          ? { ...c, value: `${prefix}:${fieldName}:${valSearch}` }
                                          : c
                                      );
                                      setConditions(updated);
                                      setIsDirty(true);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all cursor-pointer text-center"
                                  >
                                    {t('editor.condition.apply')}
                                  </button>
                                </div>
                              ) : (
                                <div className="w-[200px] p-2 flex flex-col gap-1.5 shrink-0 bg-white">
                                  <div className="relative">
                                    <Search size={11} className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    <input
                                      type="text"
                                      placeholder={t('audience.panel.search_ellipsis')}
                                      value={valSearch}
                                      onChange={(e) => setValSearch(e.target.value)}
                                      className="w-full pl-7 pr-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-semibold focus:outline-none focus:bg-white focus:border-indigo-400 transition-all text-slate-800"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="max-h-40 overflow-y-auto flex flex-col gap-0.5 custom-scrollbar">
                                    {filteredFieldValues.map((valObj) => (
                                      <button
                                        key={valObj.name}
                                        type="button"
                                        onClick={() => {
                                          const updated = conditions.map((c) =>
                                            c.id === cond.id ? { ...c, value: valObj.name } : c
                                          );
                                          setConditions(updated);
                                          setIsDirty(true);
                                          setActiveDropdownId(null);
                                        }}
                                        className={`w-full flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 border border-transparent rounded-lg text-left text-xs font-bold transition-all cursor-pointer group ${
                                          cond.value === valObj.name
                                            ? 'text-indigo-750 bg-indigo-50/30 border-slate-150'
                                            : 'text-slate-700 hover:text-indigo-650'
                                        }`}
                                      >
                                        <span className="truncate">{valObj.name}</span>
                                        <span className="text-[10px] text-slate-400 font-extrabold group-hover:text-indigo-500 transition-colors shrink-0">
                                          {valObj.count}
                                        </span>
                                      </button>
                                    ))}
                                    {filteredFieldValues.length === 0 && (
                                      <span className="text-[10px] text-slate-400 font-semibold text-center py-4">
                                        {t('audience.panel.no_matches')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                })}

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsConditionDropdownOpen(!isConditionDropdownOpen)}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-indigo-400 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-white hover:bg-slate-50/20 rounded-xl transition-all cursor-pointer shadow-xs border-dashed whitespace-nowrap"
                  >
                    <span>{t('audience.panel.add_condition')}</span>
                  </button>

                  {isConditionDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30 bg-transparent cursor-default"
                        onClick={() => setIsConditionDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 mt-1.5 w-[460px] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden z-45 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="p-3 border-b border-slate-100 flex items-center gap-2 relative">
                          <Search size={13} className="text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder={t('audience.panel.search_filters')}
                            value={dropdownSearch}
                            onChange={(e) => setDropdownSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-400 transition-all text-slate-800"
                            autoFocus
                          />
                        </div>

                        <div className="flex h-56 bg-white">
                          <div className="w-44 bg-slate-50/50 border-r border-slate-100 p-2 space-y-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedCategory('general')}
                              className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                selectedCategory === 'general'
                                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                                  : 'text-slate-655 hover:bg-slate-100'
                              }`}
                            >
                              {t('audience.panel.general_filters')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCategory('system')}
                              className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                selectedCategory === 'system'
                                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                                  : 'text-slate-655 hover:bg-slate-100'
                              }`}
                            >
                              {t('audience.panel.system_fields')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCategory('custom')}
                              className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                                selectedCategory === 'custom'
                                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-100'
                                  : 'text-slate-655 hover:bg-slate-100'
                              }`}
                            >
                              {t('audience.panel.custom_fields')}
                            </button>
                          </div>

                          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-0.5 bg-white custom-scrollbar">
                            {filteredItems.length > 0 ? (
                              filteredItems.map((item, idx) => {
                                const IconComponent = item.icon || Plus;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAddConditionItem(item)}
                                    className="w-full px-3 py-2 hover:bg-slate-50 hover:text-indigo-655 rounded-lg text-left text-xs font-bold text-slate-700 flex items-center gap-2.5 transition-colors cursor-pointer group"
                                  >
                                    <IconComponent size={14} className="text-slate-400 shrink-0" />
                                    <span className="truncate flex-1">{item.label}</span>
                                    {(item as any).count !== undefined && (
                                      <span className="text-[10px] text-slate-400 font-extrabold group-hover:text-indigo-500 transition-colors shrink-0">
                                        {(item as any).count}
                                      </span>
                                    )}
                                  </button>
                                );
                              })
                            ) : (
                              <div className="text-[10px] text-slate-400 italic text-center py-12">
                                {t('audience.panel.no_matching_items')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
