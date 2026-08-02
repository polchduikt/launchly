import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import type { ConditionNodeEditorProps, ConditionBranch } from '../../../../../../types/bot';
import { CONDITION_OPERATORS, getOperatorLabel } from '../../../../../../const/editorOptions';
import { FieldVariableSelector } from './FieldVariableSelector';
import { useBotStore } from '../../../../../../store/useBotStore';
import { useTagsQuery } from '../../../../../../hooks/broadcast/useBroadcastQueries';
import { t } from '../../../../../../i18n/config';

interface EditorStateLocal {
  setIsNextStepDrawerOpen: (open: boolean) => void;
  setNextStepSourceHandle: (handle: string | null) => void;
}

import { useEffect } from 'react';
import { getCustomFieldsApi, saveCustomFieldsApi } from '../../../../../../api/bot';

export const ConditionNodeEditor: React.FC<ConditionNodeEditorProps> = ({ data, handleChange, editorState }) => {
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);

  const [userFields, setUserFields] = useState<Array<{ name: string; type: string; description: string }>>([]);

  useEffect(() => {
    if (activeBotId) {
      getCustomFieldsApi(activeBotId)
        .then((data) => {
          if (data && typeof data === 'object') {
            if (Array.isArray(data.fields)) setUserFields(data.fields);
            else if (Array.isArray(data)) setUserFields(data);
          }
        })
        .catch((err) => console.error('Failed to load custom fields:', err));
    }
  }, [activeBotId]);

  const customFields = useMemo(() => {
    return userFields.map(f => f.name);
  }, [userFields]);

  const handleCreateCustomField = (name: string) => {
    const newField = { name, type: 'Text', description: '' };
    const updated = [...userFields, newField];
    setUserFields(updated);
    if (activeBotId) {
      saveCustomFieldsApi(activeBotId, { fields: updated }).catch((err) =>
        console.error('Failed to save custom field:', err)
      );
    }
  };

  const rawBranches = data?.branches;
  const branches = (Array.isArray(rawBranches)
    ? rawBranches
    : (data?.variable
        ? [{ id: 'branch_0', matchType: 'all', conditions: [{ id: 'legacy', variable: data.variable, operator: data.operator, value: data.value, caseSensitive: false }] }]
        : [{ id: 'branch_0', matchType: 'all', conditions: [] }])) as ConditionBranch[];

  type ConditionItem = NonNullable<ConditionBranch['conditions']>[number] & { caseSensitive?: boolean };

  const updateBranches = (newBranches: ConditionBranch[]) => {
    handleChange('branches', newBranches);
  };

  const toggleMatchType = (branchId: string, current: string) => {
    const nextVal = current === 'all' ? 'any' : 'all';
    const updated = branches.map((b) =>
      b.id === branchId ? { ...b, matchType: nextVal } : b
    );
    updateBranches(updated);
  };

  const addCondition = (branchId: string) => {
    const newCond: ConditionItem = {
      id: `cond_${Date.now()}`,
      variable: '',
      operator: 'is',
      value: '',
      caseSensitive: false
    };
    const updated = branches.map((b) =>
      b.id === branchId
        ? { ...b, conditions: [...(b.conditions || []), newCond] }
        : b
    );
    updateBranches(updated);
  };

  const removeCondition = (branchId: string, condId: string) => {
    const updated = branches.map((b) => {
      if (b.id === branchId) {
        return {
          ...b,
          conditions: (b.conditions || []).filter((c: ConditionItem) => c.id !== condId)
        };
      }
      return b;
    });
    updateBranches(updated);
    if (popoverState?.condId === condId) {
      setPopoverState(null);
    }
  };

  const updateConditionField = (branchId: string, condId: string, key: string, val: unknown) => {
    const updated = branches.map((b) => {
      if (b.id === branchId) {
        return {
          ...b,
          conditions: (b.conditions || []).map((c: ConditionItem) =>
            c.id === condId ? { ...c, [key]: val } : c
          )
        };
      }
      return b;
    });
    updateBranches(updated);
  };

  const addBranch = () => {
    const newBranch = {
      id: `branch_${branches.length}`,
      matchType: 'all',
      conditions: []
    };
    updateBranches([...branches, newBranch]);
  };

  const removeBranch = (branchId: string) => {
    if (branches.length <= 1) return;
    const updated = branches.filter((b) => b.id !== branchId);
    updateBranches(updated);
  };

  const [popoverState, setPopoverState] = useState<{
    branchId: string;
    condId: string;
    coords: { top: number; left: number };
  } | null>(null);

  const openPopover = (e: React.MouseEvent, branchId: string, condId: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverState({
      branchId,
      condId,
      coords: {
        top: rect.bottom + window.scrollY + 4,
        left: Math.max(10, rect.left + window.scrollX - 100),
      }
    });
  };

  const currentEditingCond = useMemo(() => {
    if (!popoverState) return null;
    const branch = branches.find((b) => b.id === popoverState.branchId);
    if (!branch) return null;
    return (branch.conditions || []).find((c: ConditionItem) => c.id === popoverState.condId) as ConditionItem | undefined;
  }, [popoverState, branches]);

  return (
    <div className="space-y-6">
      {branches.map((branch, idx) => {
        const conds = Array.isArray(branch.conditions) ? branch.conditions : [];
        return (
          <div key={branch.id || idx} className="bg-slate-50/50 border border-slate-200 rounded-3xl p-4 space-y-4 relative">
            {branches.length > 1 && (
              <button
                type="button"
                onClick={() => removeBranch(branch.id!)}
                className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-650 hover:bg-slate-100 rounded-lg cursor-pointer transition-all"
              >
                <X size={14} />
              </button>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-800 font-extrabold select-none mb-2">
                <span>{t('editor.condition.does_contact_match')}</span>
                <button
                  type="button"
                  onClick={() => toggleMatchType(branch.id!, branch.matchType || 'all')}
                  className="text-indigo-650 hover:text-indigo-700 underline underline-offset-2 decoration-dotted font-black cursor-pointer bg-transparent border-none p-0"
                >
                  {branch.matchType === 'all' ? t('editor.condition.all_conditions') : t('editor.condition.any_conditions')}
                </button>
              </div>

              <div className="space-y-2.5 mt-3">
                {conds.map((cond: ConditionItem, cIdx: number) => (
                  <div key={cond.id || cIdx} className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl p-2.5 shadow-sm relative pr-10">
                    <FieldVariableSelector
                      mode="variable"
                      tags={tags}
                      customFields={customFields}
                      onCreateCustomField={handleCreateCustomField}
                      trigger={
                        <button
                          type="button"
                          className="px-2.5 py-1 text-[11px] font-bold text-slate-650 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer max-w-[100px] truncate"
                        >
                          {cond.variable ? (cond.variable.charAt(0).toUpperCase() + cond.variable.slice(1).replace(/_/g, ' ')) : t('editor.condition.select_field')}
                        </button>
                      }
                      onSelect={(val) => updateConditionField(branch.id!, cond.id!, 'variable', val)}
                    />

                    <button
                      type="button"
                      onClick={(e) => openPopover(e, branch.id!, cond.id!)}
                      className="px-2 py-1 text-[11px] font-bold text-indigo-650 hover:text-indigo-750 underline underline-offset-2 decoration-dashed bg-transparent cursor-pointer border-none"
                    >
                      {getOperatorLabel(cond.operator || 'is')}
                    </button>

                    {cond.operator !== 'has_any_value' && cond.operator !== 'not_empty' && cond.operator !== 'is_unknown' && cond.operator !== 'empty' && (
                      <button
                        type="button"
                        onClick={(e) => openPopover(e, branch.id!, cond.id!)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-650 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer max-w-[80px] truncate"
                      >
                        {cond.value || '(empty)'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => removeCondition(branch.id!, cond.id!)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-450 hover:text-slate-650 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => addCondition(branch.id!)}
                className="w-full py-2.5 bg-white hover:bg-teal-50/30 border border-dashed border-teal-200 hover:border-teal-400 text-teal-650 hover:text-teal-700 text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 select-none shadow-xs"
              >
                <Plus size={13} />
                <span>{t('editor.condition.add_condition')}</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">{t('editor.condition.yes_matches')}</p>
              <button
                type="button"
                onClick={() => {
                  if (editorState) {
                    (editorState as EditorStateLocal).setNextStepSourceHandle(`branch_${idx}`);
                    (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true);
                  }
                }}
                className="w-full py-2.5 bg-white hover:bg-blue-50/20 border border-dashed border-blue-200 hover:border-blue-400 text-blue-600 hover:text-blue-700 text-xs font-bold rounded-2xl transition-all cursor-pointer text-center select-none shadow-xs"
              >
                {t('editor.condition.choose_next_step')}
              </button>
            </div>
          </div>
        );
      })}

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">{t('editor.condition.if_not')}</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          onClick={addBranch}
          className="w-full py-2.5 bg-white hover:bg-teal-50/30 border border-dashed border-teal-200 hover:border-teal-400 text-teal-650 hover:text-teal-700 text-xs font-extrabold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 select-none shadow-xs"
        >
          <Plus size={13} />
          <span>{t('editor.condition.add_another')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (editorState) {
              (editorState as EditorStateLocal).setNextStepSourceHandle('fallback');
              (editorState as EditorStateLocal).setIsNextStepDrawerOpen(true);
            }
          }}
          className="w-full py-2.5 bg-white hover:bg-blue-50/20 border border-dashed border-blue-200 hover:border-blue-400 text-blue-600 hover:text-blue-700 text-xs font-bold rounded-2xl transition-all cursor-pointer text-center select-none shadow-xs"
        >
          {t('editor.condition.choose_next_step')}
        </button>
      </div>

      {popoverState && currentEditingCond && createPortal(
        <>
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setPopoverState(null)}
          />
          <div
            style={{
              position: 'absolute',
              top: `${popoverState.coords.top}px`,
              left: `${popoverState.coords.left}px`,
              zIndex: 99999,
            }}
            className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-3xl shadow-2xl flex overflow-hidden w-[400px] h-[260px] font-['JetBrains_Mono',monospace] text-[#0A0A0A]"
          >
            <div className="w-[145px] bg-[#F2EBDD] border-r-2 border-[#0A0A0A] p-2.5 flex flex-col gap-1 select-none overflow-y-auto custom-scrollbar">
              {CONDITION_OPERATORS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    updateConditionField(popoverState.branchId, popoverState.condId, 'operator', opt.value);
                  }}
                  className={`w-full px-2.5 py-1.5 text-left text-[11px] font-bold rounded-xl transition-all cursor-pointer border-2 ${
                    currentEditingCond.operator === opt.value
                      ? 'bg-[#0A0A0A] text-[#F2EBDD] border-[#0A0A0A]'
                      : 'border-transparent text-[#0A0A0A] hover:bg-[#0A0A0A]/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-4 flex flex-col justify-between bg-[#F2EBDD]">
              {currentEditingCond.operator !== 'has_any_value' &&
               currentEditingCond.operator !== 'not_empty' &&
               currentEditingCond.operator !== 'is_unknown' &&
               currentEditingCond.operator !== 'empty' ? (
                <div className="space-y-3">
                  <label htmlFor="popoverValue" className="block text-[10px] font-black text-[#0A0A0A] uppercase tracking-wider font-['Anybody',sans-serif]">
                    {t('editor.condition.value_to_compare')}
                  </label>
                  <div className="relative">
                    <input
                      id="popoverValue"
                      type="text"
                      value={currentEditingCond.value || ''}
                      onChange={(e) => updateConditionField(popoverState.branchId, popoverState.condId, 'value', e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full pl-3 pr-10 py-2 border-2 border-[#0A0A0A] focus:outline-none text-xs font-bold rounded-xl bg-white text-[#0A0A0A]"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
                      <FieldVariableSelector
                        mode="variable"
                        tags={tags}
                        customFields={customFields}
                        onSelect={(val) => {
                          const currentVal = currentEditingCond.value || '';
                          updateConditionField(popoverState.branchId, popoverState.condId, 'value', currentVal + `{${val}}`);
                        }}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 select-none cursor-pointer text-[11px] font-bold text-[#0A0A0A] mt-2.5">
                    <input
                      type="checkbox"
                      checked={!!currentEditingCond.caseSensitive}
                      onChange={(e) => updateConditionField(popoverState.branchId, popoverState.condId, 'caseSensitive', e.target.checked)}
                      className="rounded border-2 border-[#0A0A0A] text-[#0A0A0A] focus:ring-0 w-3.5 h-3.5"
                    />
                    <span>{t('editor.condition.case_sensitivity')}</span>
                  </label>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-[#0A0A0A]/60 text-xs italic font-bold">
                  {t('editor.condition.no_value_required')}
                </div>
              )}

              <div className="flex justify-end pt-2 border-t-2 border-[#0A0A0A]/20 mt-2">
                <button
                  type="button"
                  onClick={() => setPopoverState(null)}
                  className="px-4 py-1.5 bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-[#F2EBDD] rounded-xl text-xs font-black cursor-pointer transition-all border-2 border-[#0A0A0A] uppercase font-['Anybody',sans-serif]"
                >
                  {t('editor.condition.apply')}
                </button>
              </div>
            </div>
          </div>
        </>
      , document.body)}
    </div>
  );
};
