import React, { useMemo, useState, useRef } from 'react';
import { useEdges, useReactFlow } from '@xyflow/react';
import { Plus, Trash2, Shuffle, Clock, ChevronDown, ArrowRight } from 'lucide-react';
import { t } from '../../../../../../i18n/config';
import { FieldVariableSelector } from './FieldVariableSelector';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useCustomFieldsQuery, useSaveCustomFieldsMutation } from '../../../../../../hooks/bot/useCustomFieldsQuery';
import { useTagsQuery } from '../../../../../../hooks/broadcast/useBroadcastQueries';
import { useClickOutside } from '../../../../../../hooks/useClickOutside';
import { FLOW_DEFAULTS, TIMING } from '../../../../../../const/constants';

export interface QueryFilter {
  field: string;
  operator: string;
  value: string;
}

interface QueryNodeEditorProps {
  nodeId?: string;
  data: Record<string, unknown>;
  handleChange: (keyOrUpdates: string | Record<string, unknown>, value?: unknown) => void;
  editorState?: {
    setIsNextStepDrawerOpen: (open: boolean) => void;
    setNextStepSourceHandle: (handle: string | null) => void;
  };
  onSelectNode?: (nodeId: string | null) => void;
}

const OPERATOR_OPTIONS = [
  { value: 'equals', symbol: '=', labelKey: 'editor.query.op_equals', defaultLabel: 'Дорівнює' },
  { value: 'not_equals', symbol: '!=', labelKey: 'editor.query.op_not_equals', defaultLabel: 'Не дорівнює' },
  { value: 'greater_than', symbol: '>', labelKey: 'editor.query.op_greater_than', defaultLabel: 'Більше' },
  { value: 'greater_than_or_equals', symbol: '>=', labelKey: 'editor.query.op_greater_than_or_equals', defaultLabel: 'Більше або дорівнює' },
  { value: 'less_than', symbol: '<', labelKey: 'editor.query.op_less_than', defaultLabel: 'Менше' },
  { value: 'less_than_or_equals', symbol: '<=', labelKey: 'editor.query.op_less_than_or_equals', defaultLabel: 'Менше або дорівнює' },
  { value: 'contains', symbol: '~', labelKey: 'editor.query.op_contains', defaultLabel: 'Містить' },
  { value: 'not_contains', symbol: '!~', labelKey: 'editor.query.op_not_contains', defaultLabel: 'Не містить' },
  { value: 'exists', symbol: 'Є', labelKey: 'editor.query.op_exists', defaultLabel: 'Встановлено' },
  { value: 'not_exists', symbol: '∅', labelKey: 'editor.query.op_not_exists', defaultLabel: 'Не встановлено' },
];

const OperatorDropdown: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside([dropdownRef], () => setIsOpen(false), isOpen);

  const selectedOp = OPERATOR_OPTIONS.find((o) => o.value === value) || OPERATOR_OPTIONS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-white hover:bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] flex items-center justify-between cursor-pointer transition-colors shadow-xs"
      >
        <span className="flex items-center gap-2 truncate">
          <span className="min-w-[24px] px-1 text-center font-black bg-[#0A0A0A] text-[#F2EBDD] rounded py-0.5 text-[10px] shrink-0">
            {selectedOp.symbol}
          </span>
          <span className="text-xs font-bold text-[#0A0A0A] truncate">{t(selectedOp.labelKey, selectedOp.defaultLabel)}</span>
        </span>
        <span className="p-1 rounded-lg hover:bg-[#0A0A0A]/10 transition-colors flex items-center justify-center shrink-0 ml-1">
          <ChevronDown size={14} className={`text-[#0A0A0A] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border-2 border-[#0A0A0A] rounded-xl shadow-xl overflow-hidden p-1 flex flex-col gap-0.5 max-h-48 overflow-y-auto custom-scrollbar">
          {OPERATOR_OPTIONS.map((op) => {
            const isSel = op.value === value;
            return (
              <button
                key={op.value}
                type="button"
                onClick={() => {
                  onChange(op.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-left text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                  isSel
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-[#0A0A0A] hover:bg-[#0A0A0A]/5 bg-transparent'
                }`}
              >
                <span className={`min-w-[24px] px-1 text-center font-black rounded py-0.5 text-[10px] shrink-0 ${isSel ? 'bg-[#F2EBDD] text-[#0A0A0A]' : 'bg-[#0A0A0A] text-[#F2EBDD]'}`}>
                  {op.symbol}
                </span>
                <span className="truncate text-xs">{t(op.labelKey, op.defaultLabel)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const QueryNodeEditor: React.FC<QueryNodeEditorProps> = ({
  nodeId,
  data,
  handleChange,
  editorState,
  onSelectNode,
}) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const { setNodes, fitView } = useReactFlow();

  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: customFieldsData } = useCustomFieldsQuery(activeBotId);
  const saveCustomFieldsMutation = useSaveCustomFieldsMutation(activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);

  const customFieldsList = useMemo(() => {
    if (!customFieldsData || typeof customFieldsData !== 'object') return [];
    const list = Array.isArray(customFieldsData.fields)
      ? customFieldsData.fields
      : Array.isArray(customFieldsData)
        ? customFieldsData
        : [];
    return list
      .map((f: unknown) => {
        const item = f as { name?: string; type?: string; description?: string } | string;
        return typeof item === 'string' ? item : item?.name || '';
      })
      .filter(Boolean);
  }, [customFieldsData]);

  const handleCreateCustomField = (name: string) => {
    if (!activeBotId || !name.trim()) return;
    const existing = Array.isArray(customFieldsData?.fields) ? customFieldsData.fields : [];
    const updated = [
      ...existing.filter((f: unknown) => (typeof f === 'string' ? f !== name : (f as { name?: string })?.name !== name)),
      { name: name.trim(), type: 'Text', description: '' }
    ];
    saveCustomFieldsMutation.mutate({ fields: updated });
  };

  const filters: QueryFilter[] = Array.isArray(data?.filters) ? (data.filters as QueryFilter[]) : [];
  const sortOrder = (data?.sortOrder as string) || 'RANDOM';
  const excludeSelf = data?.excludeSelf !== undefined ? Boolean(data.excludeSelf) : true;
  const excludeInteractions: string[] = Array.isArray(data?.excludeInteractions)
    ? (data.excludeInteractions as string[])
    : ['like', 'dislike'];

  const addFilter = () => {
    const newFilters = [...filters, { field: '', operator: 'equals', value: '' }];
    handleChange('filters', newFilters);
  };

  const updateFilter = (index: number, key: keyof QueryFilter, val: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: val };
    handleChange('filters', newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    handleChange('filters', newFilters);
  };

  const toggleExcludeInteraction = (type: string) => {
    if (excludeInteractions.includes(type)) {
      handleChange('excludeInteractions', excludeInteractions.filter((t) => t !== type));
    } else {
      handleChange('excludeInteractions', [...excludeInteractions, type]);
    }
  };

  const handleJumpToNode = (targetId: string) => {
    if (onSelectNode) {
      onSelectNode(targetId);
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          selected: node.id === targetId,
        }))
      );
      setTimeout(() => {
        fitView({
          nodes: [{ id: targetId }],
          duration: FLOW_DEFAULTS.FIT_VIEW_DURATION_MS,
          padding: FLOW_DEFAULTS.FIT_VIEW_PADDING,
        });
      }, TIMING.FOCUS_DELAY_MS);
    }
  };

  const openNextStep = (handleId: string) => {
    if (editorState) {
      editorState.setNextStepSourceHandle(handleId);
      editorState.setIsNextStepDrawerOpen(true);
    }
  };

  const foundEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'found');
  const isFoundConnected = !!foundEdge;
  const foundTargetId = foundEdge?.target;

  const notFoundEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'not_found');
  const isNotFoundConnected = !!notFoundEdge;
  const notFoundTargetId = notFoundEdge?.target;

  return (
    <div className="space-y-4 font-['JetBrains_Mono',monospace]">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
            {t('editor.query.filters_title', 'Критерії пошуку')}
          </label>
          <button
            type="button"
            onClick={addFilter}
            className="flex items-center gap-1 text-[10px] font-black uppercase text-[#0A0A0A] hover:opacity-70 cursor-pointer"
          >
            <Plus size={12} />
            <span>{t('editor.query.add_filter', 'Додати')}</span>
          </button>
        </div>

        {filters.length === 0 ? (
          <div className="p-3 bg-[#F2EBDD] border-2 border-dashed border-[#0A0A0A]/40 rounded-2xl text-center text-xs text-[#0A0A0A]/60 italic font-bold">
            {t('editor.query.no_filters_desc', 'Немає фільтрів: будуть вибиратися всі доступні контакти.')}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filters.map((filter, index) => (
              <div key={index} className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl space-y-2.5 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#0A0A0A]/60">
                      {t('editor.query.contact_field', 'Поле контакту')}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFilter(index)}
                      className="p-1 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-600 rounded-lg cursor-pointer transition-colors"
                      title={t('editor.query.delete_filter', 'Видалити фільтр')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <FieldVariableSelector
                    mode="field"
                    className="w-full relative block"
                    customFields={customFieldsList}
                    tags={tags}
                    onCreateCustomField={handleCreateCustomField}
                    onSelect={(fieldName) => updateFilter(index, 'field', fieldName)}
                    trigger={
                      <button
                        type="button"
                        className="w-full px-3 py-2 bg-white hover:bg-slate-50 border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-left truncate flex items-center justify-between cursor-pointer shadow-xs transition-colors group"
                      >
                        <span className="truncate text-[#0A0A0A]">{filter.field || t('editor.query.select_field', 'Оберіть поле')}</span>
                        <span className="p-1 px-1.5 text-[10px] text-[#0A0A0A] font-black rounded-lg hover:bg-[#0A0A0A]/10 transition-colors shrink-0 ml-1.5">{`{ }`}</span>
                      </button>
                    }
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#0A0A0A]/60 block">
                    {t('editor.query.operator', 'Оператор')}
                  </span>
                  <OperatorDropdown
                    value={filter.operator}
                    onChange={(val) => updateFilter(index, 'operator', val)}
                  />
                </div>

                {filter.operator !== 'exists' && filter.operator !== 'not_exists' && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#0A0A0A]/60 block">
                      {t('editor.query.value', 'Значення')}
                    </span>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        placeholder={t('editor.query.value_placeholder', 'Значення')}
                        className="w-full pl-3 pr-8 py-2 bg-white hover:bg-slate-50 focus:bg-white border-2 border-[#0A0A0A] rounded-xl text-xs font-bold text-[#0A0A0A] focus:outline-none placeholder:text-[#0A0A0A]/40"
                      />
                      <div className="absolute right-1.5">
                        <FieldVariableSelector
                          mode="variable"
                          customFields={customFieldsList}
                          tags={tags}
                          onCreateCustomField={handleCreateCustomField}
                          onSelect={(val) => updateFilter(index, 'value', val)}
                          trigger={
                            <button
                              type="button"
                              title={t('editor.query.insert_var', 'Вставити змінну')}
                              className="p-1 px-1.5 text-[10px] font-black text-[#0A0A0A] hover:bg-[#0A0A0A]/10 rounded-lg cursor-pointer transition-colors"
                            >
                              {`{ }`}
                            </button>
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.query.exclude_interactions', 'Виключати раніше переглянутих')}
        </label>
        <div className="grid grid-cols-3 gap-1 bg-white border-2 border-[#0A0A0A] p-1 rounded-xl select-none">
          {[
            { key: 'like', label: t('editor.query.type_like_past', 'Лайкнуті') },
            { key: 'dislike', label: t('editor.query.type_dislike_past', 'Пропущені') },
            { key: 'viewed', label: t('editor.query.type_viewed_past', 'Переглянуті') },
          ].map((item) => {
            const isSelected = excludeInteractions.includes(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleExcludeInteraction(item.key)}
                className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer border-none flex items-center justify-center text-center ${
                  isSelected
                    ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                    : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider mb-1.5">
          {t('editor.query.sort_order', 'Порядок вибірки')}
        </label>
        <div className="grid grid-cols-2 gap-1.5 bg-white border-2 border-[#0A0A0A] p-1 rounded-xl select-none">
          <button
            type="button"
            onClick={() => handleChange('sortOrder', 'RANDOM')}
            className={`px-2 py-1.5 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              sortOrder === 'RANDOM'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <Shuffle size={13} />
            <span>{t('editor.query.sort_random', 'Випадковий')}</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('sortOrder', 'NEWEST')}
            className={`px-2 py-1.5 text-xs font-black uppercase rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
              sortOrder === 'NEWEST'
                ? 'bg-[#0A0A0A] text-[#F2EBDD]'
                : 'text-[#0A0A0A] hover:bg-[#F2EBDD] bg-transparent'
            }`}
          >
            <Clock size={13} />
            <span>{t('editor.query.sort_newest', 'Найновіші')}</span>
          </button>
        </div>
      </div>

      <div className="p-3 bg-white border-2 border-[#0A0A0A] rounded-2xl">
        <label className="flex items-center justify-between cursor-pointer select-none">
          <span className="text-xs font-bold text-[#0A0A0A]">
            {t('editor.query.exclude_self', 'Виключати власну анкету')}
          </span>
          <input
            type="checkbox"
            checked={excludeSelf}
            onChange={(e) => handleChange('excludeSelf', e.target.checked)}
            className="w-4 h-4 accent-[#0A0A0A] cursor-pointer"
          />
        </label>
      </div>

      <div className="space-y-2 pt-2 border-t-2 border-[#0A0A0A]/10">
        <label className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider">
          {t('editor.query.flow_routing', 'Маршрутизація сценарію')}
        </label>
        
        <div
          onClick={() => {
            if (isFoundConnected && foundTargetId) {
              handleJumpToNode(foundTargetId);
            } else {
              openNextStep('found');
            }
          }}
          className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-600 rounded-xl text-xs font-black text-emerald-900 flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
        >
          <span>{t('editor.query.if_found', 'Якщо знайдено кандидата')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isFoundConnected && foundTargetId) {
                handleJumpToNode(foundTargetId);
              } else {
                openNextStep('found');
              }
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isFoundConnected
                ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-2 border-emerald-600 cursor-pointer'
                : 'border-2 border-emerald-600/50 bg-white text-emerald-600/50 cursor-pointer'
            }`}
          >
            {isFoundConnected ? (
              <ArrowRight size={11} className="stroke-[2.5]" />
            ) : null}
          </button>
        </div>

        <div
          onClick={() => {
            if (isNotFoundConnected && notFoundTargetId) {
              handleJumpToNode(notFoundTargetId);
            } else {
              openNextStep('not_found');
            }
          }}
          className="w-full p-2.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-500 rounded-xl text-xs font-black text-slate-900 flex items-center justify-between cursor-pointer transition-colors shadow-xs select-none"
        >
          <span>{t('editor.query.if_not_found', 'Якщо не знайдено')}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isNotFoundConnected && notFoundTargetId) {
                handleJumpToNode(notFoundTargetId);
              } else {
                openNextStep('not_found');
              }
            }}
            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all shrink-0 ${
              isNotFoundConnected
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-2 border-emerald-500 cursor-pointer'
                : 'border-2 border-slate-400/60 bg-white text-slate-400 cursor-pointer'
            }`}
          >
            {isNotFoundConnected ? (
              <ArrowRight size={11} className="stroke-[2.5]" />
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
};
