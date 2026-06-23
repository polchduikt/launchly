import React, { useEffect } from 'react';
import { useEdges, useNodes } from '@xyflow/react';
import { Info, Shuffle, ChevronDown, Plus, Trash2 } from 'lucide-react';
import type { CustomNodeData } from '../../../../../types/bot';

interface RandomizerNodeEditorProps {
  nodeId: string;
  data: CustomNodeData;
  handleChange: (key: string, value: unknown) => void;
  editorState?: any;
}

const VARIATION_COLORS = [
  '#7C3AED',
  '#B45309',
  '#A21CAF',
  '#0F766E',
  '#1D4ED8',
  '#BE123C',
  '#047857',
  '#4338CA',
];

export const RandomizerNodeEditor: React.FC<RandomizerNodeEditorProps> = ({
  nodeId,
  data,
  handleChange,
  editorState,
}) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const nodes = useNodes();

  const pickEveryTime = !!data.pickEveryTime;
  const variations = data.variations || [
    { id: 'variation_0', label: 'A', percentage: 50, color: '#7C3AED' },
    { id: 'variation_1', label: 'B', percentage: 50, color: '#B45309' },
  ];

  const totalAssigned = variations.reduce((sum, v) => sum + v.percentage, 0);

  const distributeEqually = (vars: any[]) => {
    const count = vars.length;
    if (count === 0) return vars;
    const base = Math.floor(100 / count);
    const remainder = 100 % count;
    return vars.map((v, idx) => ({
      ...v,
      percentage: base + (idx < remainder ? 1 : 0),
    }));
  };

  const handlePercentageChange = (index: number, newVal: number) => {
    if (isNaN(newVal)) return;
    const val = Math.max(0, Math.min(100, newVal));
    const updated = [...variations];
    updated[index] = { ...updated[index], percentage: val };

    const otherCount = variations.length - 1;
    if (otherCount > 0) {
      const remaining = 100 - val;
      const sumOthers = variations.reduce((sum, v, idx) => (idx === index ? sum : sum + v.percentage), 0);

      if (sumOthers > 0) {
        let distributedSum = 0;
        const indices: number[] = [];
        for (let i = 0; i < variations.length; i++) {
          if (i !== index) {
            indices.push(i);
            const share = Math.round((variations[i].percentage / sumOthers) * remaining);
            updated[i] = { ...updated[i], percentage: share };
            distributedSum += share;
          }
        }
        const diff = remaining - distributedSum;
        if (diff !== 0 && indices.length > 0) {
          updated[indices[0]] = {
            ...updated[indices[0]],
            percentage: updated[indices[0]].percentage + diff,
          };
        }
      } else {
        const base = Math.floor(remaining / otherCount);
        const rem = remaining % otherCount;
        let idxCount = 0;
        for (let i = 0; i < variations.length; i++) {
          if (i !== index) {
            updated[i] = {
              ...updated[i],
              percentage: base + (idxCount < rem ? 1 : 0),
            };
            idxCount++;
          }
        }
      }
    }
    handleChange('variations', updated);
  };

  const handleAddVariation = () => {
    if (variations.length >= 26) return;
    const nextIdx = variations.length;
    const newVar = {
      id: `variation_${nextIdx}`,
      label: String.fromCharCode(65 + nextIdx),
      percentage: 0,
      color: VARIATION_COLORS[nextIdx % VARIATION_COLORS.length],
    };
    const updated = [...variations, newVar];
    handleChange('variations', distributeEqually(updated));
  };

  const handleRemoveVariation = (index: number) => {
    if (variations.length <= 2) return;
    const updated = variations.filter((_, idx) => idx !== index);
    const renamed = updated.map((v, idx) => ({
      ...v,
      label: String.fromCharCode(65 + idx),
      color: VARIATION_COLORS[idx % VARIATION_COLORS.length],
    }));
    handleChange('variations', distributeEqually(renamed));
  };

  return (
    <div className="space-y-6">
      <style>{`
        ${VARIATION_COLORS.map((color, idx) => `
          .slider-theme-${idx}::-webkit-slider-runnable-track {
            background: #f1f5f9;
            height: 6px;
            border-radius: 9999px;
          }
          .slider-theme-${idx}::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 9999px;
            background: ${color};
            cursor: pointer;
            margin-top: -4px;
            transition: transform 0.1s;
            border: none;
          }
          .slider-theme-${idx}::-webkit-slider-thumb:hover {
            transform: scale(1.2);
          }
          .slider-theme-${idx}::-moz-range-track {
            background: #f1f5f9;
            height: 6px;
            border-radius: 9999px;
          }
          .slider-theme-${idx}::-moz-range-thumb {
            width: 14px;
            height: 14px;
            border-radius: 9999px;
            background: ${color};
            cursor: pointer;
            border: none;
            transition: transform 0.1s;
          }
          .slider-theme-${idx}::-moz-range-thumb:hover {
            transform: scale(1.2);
          }
        `).join('\n')}
      `}</style>

      <div>
        <h4 className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Split the traffic
        </h4>

        <div className="flex items-center justify-between border border-slate-150 rounded-2xl p-4 shadow-xs bg-slate-50/20 mb-5">
          <div className="pr-4 select-none">
            <p className="text-xs font-extrabold text-slate-700">Pick a random path every time</p>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-1">
              If enabled, evaluates a new random path on every visit. Otherwise, keeps the path persistent for the user.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleChange('pickEveryTime', !pickEveryTime)}
            className={`w-10 h-5.5 rounded-full p-0.5 transition-all cursor-pointer relative shrink-0 border-none outline-none ${
              pickEveryTime ? 'bg-purple-600' : 'bg-slate-200'
            }`}
          >
            <div
              className={`w-4.5 h-4.5 bg-white rounded-full transition-all shadow-xs ${
                pickEveryTime ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 bg-white shadow-xs select-none">
          <span className="text-xs font-extrabold text-slate-700">Assigned traffic</span>
          <span className={`text-sm font-black ${totalAssigned === 100 ? 'text-slate-800' : 'text-rose-500 animate-pulse'}`}>
            {totalAssigned}%
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {variations.map((v, idx) => {
          const isConnected = edges.some(
            (e) => e.source === nodeId && e.sourceHandle === v.id && nodes.some((n) => n.id === e.target)
          );

          return (
            <div key={v.id} className="p-4 bg-slate-50/30 border border-slate-150 rounded-2xl space-y-4">
              <div className="flex justify-between items-center select-none">
                <span className="text-xs font-black" style={{ color: v.color }}>
                  Variation {v.label}
                </span>
                {variations.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariation(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={v.percentage}
                  onChange={(e) => handlePercentageChange(idx, Number(e.target.value))}
                  className={`flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-theme-${idx}`}
                />

                <div className="flex items-center gap-1.5 w-18 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={v.percentage}
                    onChange={(e) => handlePercentageChange(idx, Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (['-', '+', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-center text-xs font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-colors shadow-2xs"
                  />
                  <span className="text-xs font-bold text-slate-400 select-none">%</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (editorState) {
                    editorState.setNextStepSourceHandle(v.id);
                    editorState.setIsNextStepDrawerOpen(true);
                  }
                }}
                className={`w-full py-2.5 border border-dashed rounded-xl text-xs font-bold transition-all cursor-pointer text-center select-none shadow-2xs ${
                  isConnected
                    ? 'bg-purple-50/20 border-purple-250 text-purple-650 hover:border-purple-400'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-500 hover:text-slate-700'
                }`}
              >
                {isConnected ? 'Step Connected' : 'Choose Next Step'}
              </button>
            </div>
          );
        })}
      </div>

      {variations.length < 26 && (
        <button
          type="button"
          onClick={handleAddVariation}
          className="w-full py-3.5 bg-white hover:bg-purple-50/10 border border-dashed border-purple-200 hover:border-purple-400 text-purple-600 hover:text-purple-700 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none shadow-xs"
        >
          <Plus size={14} />
          New Variation
        </button>
      )}
    </div>
  );
};
