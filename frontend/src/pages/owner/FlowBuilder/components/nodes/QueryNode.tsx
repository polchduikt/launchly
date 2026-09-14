import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Search } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

interface QueryFilter {
  field: string;
  operator: string;
  value: string;
}

const getOperatorSymbol = (op: string) => {
  switch (op) {
    case 'equals':
      return '=';
    case 'not_equals':
      return '!=';
    case 'greater_than':
      return '>';
    case 'less_than':
      return '<';
    case 'contains':
      return 'Містить';
    case 'exists':
      return 'Є';
    case 'not_exists':
      return 'Немає';
    default:
      return op;
  }
};

const formatFilterCount = (count: number): string => {
  if (count === 0) return 'Всі записи';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return `${count} фільтрів`;
  }
  if (mod10 === 1) {
    return `${count} фільтр`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} фільтри`;
  }
  return `${count} фільтрів`;
};

const QueryNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isGrayedOut = isConnecting && isSelfSource;
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const filters: QueryFilter[] = Array.isArray(data?.filters) ? (data.filters as QueryFilter[]) : [];

  const isFoundConnected = data?._tempSourceHandle !== 'found' && sourceConns.some((c) => c.sourceHandle === 'found');
  const isNotFoundConnected = data?._tempSourceHandle !== 'not_found' && sourceConns.some((c) => c.sourceHandle === 'not_found');

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected ? 'shadow-lg ring-2 ring-[#0A0A0A]' : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}

      <div className="relative flex items-center gap-2 bg-indigo-100/90 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-indigo-200/70 text-indigo-800 flex items-center justify-center shrink-0">
          <Search size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-indigo-800/80 uppercase tracking-wider block leading-none">
            {t('node.query.category', 'Дані')}
          </span>
          <span className="text-xs font-bold text-indigo-950 truncate block mt-0.5">
            {t('node.title.query', 'Запит даних')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-indigo-800 truncate select-none">
            {formatFilterCount(filters.length)}
          </div>
        ) : (
          <div className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-[#0A0A0A]/60">
                {t('node.query.filters_count', 'Фільтри')}
              </span>
              <span className="px-2 py-0.5 bg-white border border-[#0A0A0A] rounded-lg text-[11px] font-black text-[#0A0A0A]">
                {formatFilterCount(filters.length)}
              </span>
            </div>

            {filters.length > 0 && (
              <div className="space-y-1">
                {filters.slice(0, 3).map((f, i) => (
                  <div key={i} className="text-[10px] font-bold text-[#0A0A0A] truncate flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded border border-[#0A0A0A]/20">
                    <span className="text-[#0A0A0A]/70">{f.field}</span>
                    <span className="text-[#0A0A0A]/40 font-black">{getOperatorSymbol(f.operator)}</span>
                    <span className="font-black text-indigo-700 truncate">{f.value || '(будь-яке)'}</span>
                  </div>
                ))}
                {filters.length > 3 && (
                  <div className="text-[9px] font-bold text-[#0A0A0A]/50 italic pl-1">
                    +{filters.length - 3} ще...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <div className="relative flex items-center justify-between bg-emerald-50 border-2 border-emerald-600/60 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-800 select-none">
            <span>{t('node.query.found', 'Знайдено')}</span>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="found"
              isConnected={isFoundConnected}
              className={isFoundConnected ? '!bg-emerald-600 !border-emerald-600' : '!bg-white !border-emerald-600'}
            />
          </div>

          <div className="relative flex items-center justify-between bg-slate-100 border-2 border-slate-400/60 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 select-none">
            <span>{t('node.query.not_found', 'Не знайдено')}</span>
            <NodeHandle
              type="source"
              position={Position.Right}
              id="not_found"
              isConnected={isNotFoundConnected}
              className={isNotFoundConnected ? '!bg-slate-600 !border-slate-600' : '!bg-white !border-slate-600'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const QueryNode = React.memo(QueryNodeInner);
