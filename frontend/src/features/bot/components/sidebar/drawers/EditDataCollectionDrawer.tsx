import React, { useState, useMemo } from 'react';
import { X, Trash2, Database, Zap, AlertCircle, Sparkles, Globe, CreditCard, GitFork, Shuffle, Clock, Play, Send } from 'lucide-react';
import type { FlowBlock } from '../../../../../types/bot';
import type { Node, Edge } from '@xyflow/react';
import { NODE_TITLES } from '../../../config/nodeDisplay';
import { FieldVariableSelector } from '../editors/FieldVariableSelector';

export interface EditDataCollectionDrawerProps {
  onClose: () => void;
  block: FlowBlock | null;
  onSave: (updated: FlowBlock) => void;
  onRemove: () => void;
  edges?: Edge[];
  nodes?: Node[];
  nodeId?: string;
  onUnlinkConnection?: (handleId: string) => void;
  onAddAndConnectNode?: (sourceNodeId: string, type: string, sourceHandle: string) => void;
  onOpenNextStepDrawer?: (sourceHandle: string) => void;
  customFields?: string[];
  tags?: any[];
}

const getTargetNodeDisplayName = (tn: Node, nodes: Node[]) => {
  const filtered = nodes.filter((n) => n.type === tn.type);
  const idx = filtered.findIndex((n) => n.id === tn.id);
  const baseTitle = NODE_TITLES[tn.type || ''] || tn.type || '';
  return idx !== -1 ? `${baseTitle} #${idx + 1}` : baseTitle;
};

export const EditDataCollectionDrawer: React.FC<EditDataCollectionDrawerProps> = ({
  onClose,
  block,
  onSave,
  onRemove,
  edges = [],
  nodes = [],
  nodeId = '',
  onUnlinkConnection,
  onAddAndConnectNode,
  onOpenNextStepDrawer,
  customFields = [],
  tags = [],
}) => {
  const [replyType, setReplyType] = useState('Text');
  const [saveToField, setSaveToField] = useState('');
  const [expirationMinutes, setExpirationMinutes] = useState(30);
  const [retryCount, setRetryCount] = useState(3);

  const [prevBlockId, setPrevBlockId] = useState<string | null>(null);
  if (block && block.id !== prevBlockId) {
    setPrevBlockId(block.id);
    setReplyType((block.replyType as string) || 'Text');
    setSaveToField(block.variableName || '');
    setExpirationMinutes(typeof block.expirationMinutes === 'number' ? block.expirationMinutes : 30);
    setRetryCount(typeof block.retryCount === 'number' ? block.retryCount : 3);
  }

  if (!block) return null;

  const replyEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'reply');
  const replyNode = replyEdge ? nodes.find((n) => n.id === replyEdge.target) : null;

  const timeoutEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === 'timeout');
  const timeoutNode = timeoutEdge ? nodes.find((n) => n.id === timeoutEdge.target) : null;

  const handleFormSave = () => {
    onSave({
      ...block,
      replyType,
      variableName: saveToField,
      expirationMinutes,
      retryCount,
    });
  };

  return (
    <div className="h-full flex flex-col justify-between bg-white font-sans w-full select-none">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
        <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Edit Data Collection</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg transition-colors cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Reply Type
          </label>
          <select
            value={replyType}
            onChange={(e) => {
              setReplyType(e.target.value);
              onSave({ ...block, replyType: e.target.value, variableName: saveToField, expirationMinutes, retryCount });
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-bold bg-slate-50/20"
          >
            <option value="Text">Text</option>
            <option value="Number">Number</option>
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Save Response to a Custom Field
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-3.5 text-slate-400">
              <Database size={13} />
            </div>
            <input
              type="text"
              value={saveToField}
              onChange={(e) => {
                setSaveToField(e.target.value);
                onSave({ ...block, replyType, variableName: e.target.value, expirationMinutes, retryCount });
              }}
              placeholder="Select or enter field name..."
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold bg-slate-50/20"
            />
            <div className="absolute right-2.5">
              <FieldVariableSelector
                mode="variable"
                tags={tags}
                customFields={customFields}
                onSelect={(selectedVar) => {
                  setSaveToField(selectedVar);
                  onSave({ ...block, replyType, variableName: selectedVar, expirationMinutes, retryCount });
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Actions on successful input
          </label>
          {replyNode ? (
            <div className="flex items-center justify-between p-3.5 bg-amber-50/30 border border-amber-200/60 rounded-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-500 text-white shrink-0">
                  <Zap size={14} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Perform Actions
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {getTargetNodeDisplayName(replyNode, nodes)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUnlinkConnection?.('reply')}
                className="p-1.5 hover:bg-amber-100/50 text-slate-450 hover:text-slate-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-amber-200/60"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddAndConnectNode?.(nodeId, 'ACTION', 'reply')}
              className="w-full py-3.5 border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 text-slate-500 hover:text-indigo-600 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap size={13} />
              <span>Perform Actions</span>
            </button>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            If contact has not responded
          </label>
          <div className="p-4 bg-slate-50/40 border border-slate-100 rounded-2xl space-y-3 mb-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-650">
              <span>Expires in</span>
              <select
                value={expirationMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setExpirationMinutes(val);
                  onSave({ ...block, replyType, variableName: saveToField, expirationMinutes: val, retryCount });
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 text-xs font-extrabold"
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="1440">24 hours</option>
              </select>
            </div>
          </div>

          {timeoutNode ? (
            <div className="flex items-center justify-between p-3.5 bg-rose-50/30 border border-rose-200/60 rounded-2xl animate-fade-in">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500 text-white shrink-0">
                  <AlertCircle size={14} />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                    Timeout Flow
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-1">
                    {getTargetNodeDisplayName(timeoutNode, nodes)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onUnlinkConnection?.('timeout')}
                className="p-1.5 hover:bg-rose-100/50 text-slate-450 hover:text-slate-700 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200/60"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenNextStepDrawer?.('timeout')}
              className="w-full py-3.5 border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/10 text-slate-500 hover:text-indigo-600 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Choose Next Step</span>
            </button>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Retry if invalid
          </label>
          <div className="p-4 bg-slate-50/40 border border-slate-100 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-650">
            <span>Retry count</span>
            <select
              value={retryCount}
              onChange={(e) => {
                const val = Number(e.target.value);
                setRetryCount(val);
                onSave({ ...block, replyType, variableName: saveToField, expirationMinutes, retryCount: val });
              }}
              className="px-2 py-1 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 text-xs font-extrabold"
            >
              <option value="1">1 time</option>
              <option value="2">2 times</option>
              <option value="3">3 times</option>
              <option value="5">5 times</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-3 shrink-0">
        <button
          onClick={onRemove}
          className="flex-1 py-2.5 border border-dashed border-red-200 hover:border-red-300 hover:bg-red-50 text-red-500 hover:text-red-700 text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
        >
          <Trash2 size={13} />
          <span>Remove Block</span>
        </button>
      </div>
    </div>
  );
};
