import React from 'react';
import { UserCheck, ChevronDown, ChevronUp, X, Plus, Search } from 'lucide-react';
import type { AudienceCondition, TagResponse } from '../types';

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
  handleAddTagCondition,
  setConditions,
  setIsDirty,
}) => {
  return (
    <div className="absolute bottom-4 left-6 right-6 z-10 bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden transition-all duration-300">
      <div
        onClick={() => setIsAudienceOpen(!isAudienceOpen)}
        className="px-6 py-4 flex items-center justify-between border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <UserCheck size={14} />
          </span>
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Target Audience
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
            Preview {getAudienceCount()} contact{getAudienceCount() !== 1 ? 's' : ''}
          </span>
          <button className="text-slate-400">
            {isAudienceOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>

      {isAudienceOpen && (
        <div className="p-6 bg-slate-50/50 space-y-4">
          <div className="text-xs text-slate-550 font-bold uppercase">
            Send to contacts matching <span className="underline decoration-indigo-500 underline-offset-2 text-indigo-700 cursor-pointer">all of the following conditions:</span>
          </div>

          {conditions.length > 0 && (
            <div className="flex flex-wrap gap-3 py-1 animate-in fade-in duration-200">
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs min-w-56 relative group animate-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    {cond.field.toUpperCase()}
                  </div>
                  <div className="text-xs text-slate-800 font-extrabold flex items-center gap-1.5">
                    <span className="text-slate-400 font-semibold">{cond.operator}</span>
                    <span>{cond.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setIsConditionDropdownOpen(!isConditionDropdownOpen)}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-dashed border-slate-300 hover:border-indigo-400 text-xs font-bold text-slate-600 hover:text-indigo-650 hover:bg-white rounded-xl transition-all cursor-pointer"
            >
              <Plus size={12} />
              <span>Condition</span>
            </button>

            {isConditionDropdownOpen && (
              <div className="absolute bottom-12 left-0 w-[480px] bg-white border border-slate-200 rounded-2xl shadow-xl flex overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <div className="w-44 bg-slate-50 border-r border-slate-100 p-2 space-y-1">
                  <button
                    onClick={() => setSelectedCategory('general')}
                    className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-all ${
                      selectedCategory === 'general' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    General Filters
                  </button>
                  <button
                    onClick={() => setSelectedCategory('system')}
                    className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-all ${
                      selectedCategory === 'system' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    System Fields
                  </button>
                  <button
                    onClick={() => setSelectedCategory('custom')}
                    className={`w-full px-3 py-2 text-left text-[11px] font-bold rounded-lg transition-all ${
                      selectedCategory === 'custom' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Custom User Fields
                  </button>
                </div>

                <div className="flex-1 p-3 flex flex-col min-h-60 max-h-72 overflow-y-auto">
                  <div className="relative mb-2 shrink-0">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      disabled
                      placeholder="Search filters..."
                      className="w-full pl-7 pr-3 py-1.5 border border-slate-200 rounded-lg text-[10px]"
                    />
                  </div>

                  {selectedCategory === 'general' && (
                    <div className="space-y-0.5">
                      <div className="text-[9px] font-bold text-slate-400 uppercase px-2 py-1 tracking-wider">
                        Filter Tags
                      </div>
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleAddTagCondition(tag.name)}
                            className="w-full px-3 py-2 hover:bg-indigo-50 rounded-lg text-left text-xs font-bold text-slate-700 flex items-center justify-between"
                          >
                            <span className="flex items-center gap-1.5">
                              <Plus size={10} className="text-slate-400" />
                              Tag: {tag.name}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="text-[10px] text-slate-400 italic px-2 py-1">
                          No tags created. Add tags in CRM page.
                        </div>
                      )}

                      <div className="h-px bg-slate-100 my-1.5" />

                      <button
                        onClick={() => {
                          setConditions((prev) => [
                            ...prev,
                            { id: `cond_${Date.now()}`, field: 'order', operator: 'is', value: 'Any Order' },
                          ]);
                          setIsConditionDropdownOpen(false);
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 hover:bg-indigo-50 rounded-lg text-left text-xs font-bold text-slate-700"
                      >
                        + Has Orders
                      </button>
                      <button
                        onClick={() => {
                          setConditions((prev) => [
                            ...prev,
                            { id: `cond_${Date.now()}`, field: 'lead', operator: 'is', value: 'Any Lead' },
                          ]);
                          setIsConditionDropdownOpen(false);
                          setIsDirty(true);
                        }}
                        className="w-full px-3 py-2 hover:bg-indigo-50 rounded-lg text-left text-xs font-bold text-slate-700"
                      >
                        + Has Leads
                      </button>
                    </div>
                  )}

                  {selectedCategory !== 'general' && (
                    <div className="text-[10px] text-slate-400 italic text-center py-10 font-medium">
                      No criteria under this section.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
