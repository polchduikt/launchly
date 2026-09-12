import React from 'react';
import { Position, useNodeConnections, useConnection, useStore } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Sliders } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData, ActionItem } from '../../../../../types/bot';
import { useNodeHover } from '../../../../../hooks/bot/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../../i18n/config';

const ActionNodeInner: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const sourceConns = useNodeConnections({ id, handleType: 'source' });
  const targetConns = useNodeConnections({ id, handleType: 'target' });
  const actions = (data?.actions || []) as ActionItem[];
  const isConnecting = useConnection((s) => s.inProgress);
  const isSelfSource = useConnection((s) => s.fromNode?.id === id);
  const isTimeoutHandle = useConnection((s) => s.fromHandle?.id === 'timeout');
  const isGrayedOut = isConnecting && (isSelfSource || isTimeoutHandle);
  const { showToolbar, bindHover } = useNodeHover();
  const isZoomedOut = useStore((s) => s.transform[2] < 0.6);

  const getActionLabelForCanvas = (type: string) => {
    switch (type) {
      case 'ADD_TAG':
        return t('node.action.add_tag');
      case 'REMOVE_TAG':
        return t('node.action.remove_tag');
      case 'SET_USER_FIELD':
        return t('node.action.set_user_field');
      case 'CLEAR_USER_FIELD':
        return t('node.action.clear_user_field');
      case 'TELEGRAM_SUBSCRIBE':
      case 'TELEGRAM_UNSUBSCRIBE':
        return t('node.action.telegram_actions');
      case 'GS_INSERT_ROW':
      case 'GS_GET_ROW':
      case 'GS_UPDATE_ROW':
        return t('node.action.sheets_actions');
      case 'MARK_DONE':
        return t('action.name.MARK_DONE');
      case 'ASSIGN_AGENT':
        return t('action.name.ASSIGN_AGENT');
      default:
        return t('node.title.action');
    }
  };

  const getActionValueForCanvas = (action: ActionItem) => {
    switch (action.type) {
      case 'ADD_TAG':
      case 'REMOVE_TAG':
        return action.tagName || t('node.action.unknown_tag');
      case 'SET_USER_FIELD':
        if (!action.fieldName) return t('node.action.unknown_field');
        return action.fieldValue
          ? t('node.action.value_set_field', { field: action.fieldName, val: action.fieldValue })
          : t('node.action.value_set_field_only', { field: action.fieldName });
      case 'CLEAR_USER_FIELD':
        return action.fieldName
          ? t('node.action.value_clear_field', { field: action.fieldName })
          : t('node.action.unknown_field');
      case 'TELEGRAM_SUBSCRIBE':
        return t('node.action.value_subscribe_tg');
      case 'TELEGRAM_UNSUBSCRIBE':
        return t('node.action.value_unsubscribe_tg');
      case 'GS_INSERT_ROW':
        return t('node.action.value_gs_insert');
      case 'GS_GET_ROW':
        return t('node.action.value_gs_get');
      case 'GS_UPDATE_ROW':
        return t('node.action.value_gs_update');
      case 'MARK_DONE':
        return t('action.name.MARK_DONE');
      case 'ASSIGN_AGENT':
        return t('action.name.ASSIGN_AGENT');
      default:
        return action.type || '';
    }
  };

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/70 backdrop-blur-[2px] border-2 border-[#0A0A0A] rounded-3xl transition-all relative overflow-visible isolate ${
        selected
          ? 'shadow-lg ring-2 ring-[#0A0A0A]'
          : 'shadow-md'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      
      <div className="relative flex items-center gap-2 bg-amber-100/75 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={targetConns.some((c) => c.source !== 'temp_menu_node')}
        />
        <span className="w-7 h-7 rounded-lg bg-amber-100/60 text-[#a87f18] flex items-center justify-center shrink-0">
          <Sliders size={13} strokeWidth={2.5} />
        </span>
        <div className="flex-1 min-w-0">
          <span className="font-extrabold text-[9px] text-[#a87f18]/70 uppercase tracking-wider block leading-none">
            {t('node.action.actions_label')}
          </span>
          <span className="text-xs font-bold text-[#6e530f] truncate block mt-0.5">
            {t('node.action.perform_actions')}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-2 font-['JetBrains_Mono',monospace]">
        {isZoomedOut ? (
          <div className="space-y-1.5 select-none pointer-events-none">
            {actions.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-[11px] font-bold text-amber-800 text-center">
                {t('node.action.no_actions')}
              </div>
            ) : (
              actions.slice(0, 3).map((act, index) => (
                <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-[11px] font-bold text-slate-700 truncate">
                  {getActionLabelForCanvas(act.type)}
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {actions.length === 0 ? (
              <div className="border-2 border-dashed border-[#0A0A0A]/40 rounded-2xl p-3 text-center text-xs text-[#0A0A0A]/60 font-black select-none italic bg-[#F2EBDD]/40">
                {t('node.action.no_actions')}
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
                {actions.map((act, index) => {
                  const label = getActionLabelForCanvas(act.type);
                  const value = getActionValueForCanvas(act);
                  return (
                    <div key={index} className="bg-[#F2EBDD] border-2 border-[#0A0A0A] rounded-2xl p-2.5 flex flex-col gap-0.5 select-none">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#0A0A0A]/60 leading-none">{label}</span>
                      <span className="text-xs font-black text-[#0A0A0A] leading-normal break-words">{value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-transparent select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-2 select-none">{t('node.action.next_step')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && sourceConns.some((c) => c.sourceHandle === 'next')}
        />
      </div>
    </div>
  );
};
ActionNodeInner.displayName = 'ActionNode';
export const ActionNode = React.memo(ActionNodeInner);
