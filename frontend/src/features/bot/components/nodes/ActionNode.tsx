import React, { useState, useEffect, useMemo } from 'react';
import { Position, useEdges, useConnection } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import { Sliders } from 'lucide-react';
import { NodeHandle } from './NodeHandle';
import type { CustomNodeData, ActionItem } from '../../../../types/bot';
import { useNodeHover } from '../../hooks/useNodeHover';
import { NodeToolbar } from './NodeToolbar';
import { t } from '../../../../i18n';

export const ActionNode: React.FC<NodeProps<Node<CustomNodeData>>> = ({ id, selected, data = {} }) => {
  const edges = useEdges().filter((e) => e.id !== 'temp_menu_edge');
  const actions = (data?.actions || []) as ActionItem[];

  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const isGrayedOut = useMemo(() => {
    if (!isConnecting) return false;
    if (connection.fromNode?.id === id) return true;
    const sourceHandleId = connection.fromHandle?.id;
    if (sourceHandleId === 'reply') {
      return false;
    }
    if (sourceHandleId === 'timeout') {
      return true;
    }
    return false;
  }, [isConnecting, connection, id]);
  const { showToolbar, bindHover } = useNodeHover();
  const [isHighlighted, setIsHighlighted] = useState(false);

  useEffect(() => {
    const handleHoverEdge = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { source, target } = customEvent.detail;
        setIsHighlighted(source === id || target === id);
      } else {
        setIsHighlighted(false);
      }
    };
    window.addEventListener('flow-hover-edge', handleHoverEdge);
    return () => {
      window.removeEventListener('flow-hover-edge', handleHoverEdge);
    };
  }, [id]);

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
      default:
        return t('node.title.action');
    }
  };

  const getActionValueForCanvas = (action: ActionItem) => {
    switch (action.type) {
      case 'ADD_TAG':
      case 'REMOVE_TAG':
        return action.tagName || 'Unknown tag';
      case 'SET_USER_FIELD':
        return action.fieldName
          ? `Set ${action.fieldName} to ${action.fieldValue || ''}`
          : 'Unknown field';
      case 'CLEAR_USER_FIELD':
        return action.fieldName
          ? `Clear ${action.fieldName}`
          : 'Unknown field';
      case 'TELEGRAM_SUBSCRIBE':
        return 'Subscribe to Telegram';
      case 'TELEGRAM_UNSUBSCRIBE':
        return 'Unsubscribe Telegram';
      case 'GS_INSERT_ROW':
        return 'Insert Row';
      case 'GS_GET_ROW':
        return 'Get Row by Value';
      case 'GS_UPDATE_ROW':
        return 'Update Row';
      default:
        return action.type || '';
    }
  };

  return (
    <div
      {...bindHover}
      className={`w-72 bg-white/75 backdrop-blur-[2px] border-2 rounded-3xl shadow-md transition-all relative overflow-visible isolate ${
        selected
          ? 'border-indigo-500 ring-4 ring-indigo-500/10'
          : isHighlighted
            ? 'border-indigo-400 ring-2 ring-indigo-50/60 shadow-sm'
            : 'border-slate-200 hover:border-slate-350'
      } ${isGrayedOut ? 'opacity-40 grayscale pointer-events-none' : ''}`}
    >
      {showToolbar && <NodeToolbar nodeId={id} />}
      
      
      <div className="relative flex items-center gap-2 bg-[#FFF1A8]/75 border-b border-[#eed796]/60 rounded-t-[22px] px-4 py-3 select-none">
        <NodeHandle
          type="target"
          position={Position.Left}
          isConnected={edges.some((e) => e.target === id && e.source !== 'temp_menu_node')}
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

      <div className="p-4 space-y-3">
        <div className="space-y-3">
          {actions.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-3 text-center text-[11px] text-slate-400 font-medium select-none italic bg-slate-50/50">
              {t('node.action.no_actions')}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-0.5 custom-scrollbar">
              {actions.map((act, index) => {
                const label = getActionLabelForCanvas(act.type);
                const value = getActionValueForCanvas(act);
                return (
                  <div key={index} className="bg-slate-50/75 border border-slate-150 rounded-xl p-2.5 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none">{label}</span>
                    <span className="text-[11px] font-extrabold text-slate-700 leading-normal">{value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end items-center px-4 py-2 bg-slate-50/30 border-t border-slate-100 select-none relative rounded-b-[22px]">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mr-2 select-none">{t('node.action.next_step')}</span>
        <NodeHandle
          type="source"
          position={Position.Right}
          id="next"
          isConnected={data?._tempSourceHandle !== 'next' && edges.some((e) => e.source === id && e.sourceHandle === 'next' && e.target !== 'temp_menu_node')}
        />
      </div>
    </div>
  );
};
ActionNode.displayName = 'ActionNode';
