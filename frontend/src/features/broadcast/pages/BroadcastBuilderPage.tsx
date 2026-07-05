import React, { useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  getBezierPath,
  getSmoothStepPath,
  ConnectionLineType,
  ReactFlowProvider,
} from '@xyflow/react';
import type { ConnectionLineComponentProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBroadcastBuilder } from '../hooks/useBroadcastBuilder';
import { AudiencePanel } from '../components';
import { FlowPreviewPanel } from '../../../components/shared/FlowPreviewPanel';
import { NodeEditorPanel } from '../../bot/components/sidebar/NodeEditorPanel';
import { EditButtonDrawer } from '../../bot/components/sidebar/drawers/EditButtonDrawer';
import { ChooseNextStepDrawer } from '../../bot/components/sidebar/drawers/ChooseNextStepDrawer';
import { EditDataCollectionDrawer } from '../../bot/components/sidebar/drawers/EditDataCollectionDrawer';
import { useNodeEditor } from '../../bot/hooks/useNodeEditor';
import { getAutoLayoutedElements } from '../../bot/utils/flowLayout';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { NODE_TYPES } from '../config/nodeTypes';
import { BROADCAST_BLOCKS } from '../config/broadcastBlocks';
import { ROUTES } from '../../../constants/routes';
import { FLOW_EDGE_DEFAULTS, EDGE_TYPES } from '../../bot/config/flowEdges';
import type { FlowBlock } from '../../../types/bot';

const BROADCAST_CONTEXT_MENU_OPTIONS = [
  { type: 'MESSAGE', label: '+ Telegram', isPro: false, isAi: false },
  { type: 'API_CALL', label: '+ AI Step', isPro: false, isAi: true },
  { type: 'ACTION', label: '+ Actions', isPro: false, isAi: false },
  { type: 'CONDITION', label: '+ Condition', isPro: true, isAi: false },
  { type: 'RANDOMIZER', label: '+ Randomizer', isPro: true, isAi: false },
  { type: 'SMART_DELAY', label: '+ Smart Delay', isPro: true, isAi: false },
  { type: 'START_AUTOMATION', label: '+ Start Automation', isPro: false, isAi: false },
];

import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  Eye,
  Edit2,
  Check,
  Grid,
  Send,
  AlertTriangle,
  Plus,
  Clock,
  GitFork,
  Route,
  Spline,
  Undo2,
  Redo2,
} from 'lucide-react';

const CustomConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
  connectionLineStyle,
  connectionLineType,
}) => {
  const edgePath = connectionLineType === 'smoothstep'
    ? getSmoothStepPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
      })[0]
    : getBezierPath({
        sourceX: fromX,
        sourceY: fromY,
        sourcePosition: fromPosition,
        targetX: toX,
        targetY: toY,
        targetPosition: toPosition,
      })[0];

  return (
    <g>
      <path
        fill="none"
        stroke="#7b8794"
        strokeWidth={2.2}
        d={edgePath}
        style={{
          ...connectionLineStyle,
          markerEnd: 'url(#arrow-grey)',
        }}
      />
    </g>
  );
};

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (dateTimeIso: string) => void;
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, onSchedule }) => {
  const [dateTime, setDateTime] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl w-96 p-6 animate-in fade-in zoom-in-95 duration-150 animate-duration-150">
        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider mb-2">
          Schedule Broadcast
        </h3>
        <p className="text-xs text-slate-400 font-semibold mb-4 leading-relaxed">
          Select the date and time to automatically send this campaign to your target audience.
        </p>

        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-250 rounded-2xl text-xs font-semibold focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all text-slate-800 mb-6"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (dateTime) {
                const iso = new Date(dateTime).toISOString();
                onSchedule(iso);
              }
            }}
            disabled={!dateTime}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
};

const ControlsStyles: React.FC = React.memo(() => (
  <style>{`
    .react-flow__controls.custom-controls-panel {
      display: flex;
      flex-direction: column;
      background: white;
    }
    .custom-controls-panel .react-flow__controls-button {
      width: 38px !important;
      height: 38px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .custom-controls-panel .react-flow__controls-button svg {
      width: 18px !important;
      height: 18px !important;
      max-width: 18px !important;
      max-height: 18px !important;
    }
  `}</style>
));

const BroadcastBuilderInner: React.FC = () => {
  const {
    activeBotId,
    campaign,
    nodes,
    setNodes,
    edges,
    setEdges,
    displayNodes,
    displayEdges,
    selectedNodeId,
    setSelectedNodeId,
    campaignName,
    setCampaignName,
    isEditingName,
    setIsEditingName,
    messageText,
    isDirty,
    setIsDirty,
    isAudienceOpen,
    setIsAudienceOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    conditions,
    setConditions,
    isConditionDropdownOpen,
    setIsConditionDropdownOpen,
    selectedCategory,
    setSelectedCategory,
    isCampaignsLoading,
    tags,
    leads,
    orders,
    activeNode,
    handleNodesChange,
    handleEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onNodeClick,
    onPaneClick,
    onNodeDragStart,
    onNodeDragStop,
    handleUpdateNodeData,
    handleAddNode,
    handleAddAndConnectNode,
    handleDeleteSelectedNode,
    handleAddTagCondition,
    handleRemoveCondition,
    handleSaveDraft,
    handleSendCampaign,
    handleScheduleCampaign,
    getAudienceCount,
    updateCampaignMut,
    sendCampaignMut,
    undo,
    redo,
    canUndo,
    canRedo,
    copySelectedNodes,
    pasteCopiedNodes,
    edgeType,
    setEdgeType,
    contextMenu,
    setContextMenu,
    handleCreateAndConnectNode,
    onSelectionChange,
  } = useBroadcastBuilder();

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);

  const customFields = React.useMemo(() => {
    if (!activeBotId) return ['last_order_product', 'last_order_price', 'phone', 'email'];
    const stored = localStorage.getItem(`launchly_custom_fields_${activeBotId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.map((f: any) => f.name);
        }
      } catch (e) {
        console.error('Failed to parse custom fields', e);
      }
    }
    return ['last_order_product', 'last_order_price', 'phone', 'email'];
  }, [activeBotId]);

  const filteredContextMenuOptions = React.useMemo(() => {
    if (!contextMenu) return BROADCAST_CONTEXT_MENU_OPTIONS;
    const handleId = contextMenu.source.handleId;
    if (handleId === 'reply') {
      return BROADCAST_CONTEXT_MENU_OPTIONS.filter((opt) => opt.type === 'ACTION');
    }
    if (handleId === 'timeout') {
      return BROADCAST_CONTEXT_MENU_OPTIONS.filter((opt) => opt.type !== 'ACTION');
    }
    return BROADCAST_CONTEXT_MENU_OPTIONS;
  }, [contextMenu]);

  const editorState = useNodeEditor(
    activeNode || undefined,
    handleUpdateNodeData,
    (sourceNodeId, type, sourceHandle) => {
      const existingEdge = edges.find(
        (e) => e.source === sourceNodeId && e.sourceHandle === sourceHandle
      );
      if (existingEdge) {
        const targetNode = nodes.find((n) => n.id === existingEdge.target);
        if (targetNode?.type === type) {
          return;
        }
      }
      handleAddAndConnectNode(sourceNodeId, type, sourceHandle);
    }
  );

  const handleAutoLayout = (direction: 'LR' | 'TB') => {
    const layouted = getAutoLayoutedElements(nodes, edges, direction);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setIsDirty(true);
  };

  const isValidConnection = React.useCallback((connection: any) => {
    if (connection.source === connection.target) return false;
    const targetNode = nodes.find((n) => n.id === connection.target);
    if (targetNode?.type === 'START_BROADCAST') return false;
    
    if (connection.sourceHandle === 'reply') {
      return targetNode?.type === 'ACTION';
    }
    if (connection.sourceHandle === 'timeout') {
      return targetNode?.type !== 'ACTION';
    }
    
    return true;
  }, [nodes]);

  const undoRef = React.useRef(undo);
  const redoRef = React.useRef(redo);
  const copyRef = React.useRef(copySelectedNodes);
  const pasteRef = React.useRef(pasteCopiedNodes);

  React.useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
    copyRef.current = copySelectedNodes;
    pasteRef.current = pasteCopiedNodes;
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );
      
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        undoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        redoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        redoRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyC') {
        e.preventDefault();
        copyRef.current();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
        e.preventDefault();
        pasteRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!activeBotId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8 text-center space-y-4">
        <AlertTriangle className="text-amber-500" size={48} />
        <h1 className="text-lg font-bold text-slate-800 font-sans">No active bot selected</h1>
        <button
          onClick={() => window.location.assign(ROUTES.HOME)}
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all cursor-pointer"
        >
          Select Bot
        </button>
      </div>
    );
  }

  if (isCampaignsLoading || !campaign) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen w-full flex flex-col bg-slate-50 font-sans overflow-hidden relative">
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between z-10 select-none">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.location.assign(ROUTES.BROADCASTS)}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <span>Broadcasts</span>
            <span>&gt;</span>
            <span>Drafts</span>
            <span>&gt;</span>
            {isEditingName ? (
              <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-100">
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => {
                    setCampaignName(e.target.value);
                    setIsDirty(true);
                  }}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingName(false);
                  }}
                  autoFocus
                  className="px-2 py-1 border border-indigo-400 rounded-lg text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <span className="font-bold text-sm text-slate-800">{campaignName}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-650 transition-all p-1"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-3.5 py-1.5 rounded-2xl font-sans">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 min-w-[85px] justify-start select-none">
              {isDirty || updateCampaignMut.isPending ? (
                <>
                  <Loader2 className="animate-spin text-indigo-500 shrink-0" size={14} />
                  <span className="text-slate-400">Saving...</span>
                </>
              ) : updateCampaignMut.isError ? (
                <div
                  title={
                    (updateCampaignMut.error as any)?.response?.data?.message ||
                    (updateCampaignMut.error as any)?.message ||
                    String(updateCampaignMut.error)
                  }
                  className="flex items-center gap-1.5 cursor-help"
                >
                  <span className="text-rose-500 shrink-0 font-bold">✕</span>
                  <span className="text-rose-500 font-bold">Failed</span>
                </div>
              ) : (
                <>
                  <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                  <span className="text-slate-500">Saved</span>
                </>
              )}
            </div>

            <div className="w-[1px] h-4 bg-slate-200" />

            <div className="flex items-center gap-1.5">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Undo2 size={15} />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Redo2 size={15} />
              </button>
            </div>
          </div>

          <div className="w-[1px] h-6 bg-slate-200 hidden sm:block" />

          <button
            onClick={() => setIsPreviewOpen((v) => !v)}
            className={`flex items-center gap-1 px-4 py-2 border text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isPreviewOpen
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Eye size={14} />
            <span>{isPreviewOpen ? 'Close Preview' : 'Preview'}</span>
          </button>

          <div className="flex items-center gap-2 select-none">
            <button
              onClick={handleSendCampaign}
              disabled={sendCampaignMut.isPending || updateCampaignMut.isPending}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-750 rounded-xl transition-all shadow-sm cursor-pointer shadow-indigo-100"
            >
              {sendCampaignMut.isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              <span>Send Now</span>
            </button>

            <button
              onClick={() => setIsScheduleModalOpen(true)}
              disabled={sendCampaignMut.isPending || updateCampaignMut.isPending}
              title="Schedule Broadcast"
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center animate-pulse animate-duration-1000"
            >
              <Clock size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 relative h-full">
          <svg style={{ position: 'absolute', width: 0, height: 0 }}>
            <defs>
              <marker
                id="arrow-grey"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#7b8794" />
              </marker>
              <marker
                id="arrow-indigo"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
              </marker>
            </defs>
          </svg>
          <div className="absolute top-4 right-4 z-10 select-none">
            <button
              onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-lg transition-all border border-indigo-500 cursor-pointer"
            >
              <Plus size={24} className={`transition-transform duration-200 ${isAddDropdownOpen ? 'rotate-45' : ''}`} />
            </button>
            {isAddDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsAddDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2.5 w-52 bg-white/95 backdrop-blur border border-slate-200 p-3 rounded-2xl shadow-xl z-20 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">
                    Add Standalone Node
                  </span>
                  {BROADCAST_BLOCKS.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => {
                        handleAddNode(item.type);
                        setIsAddDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer group"
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                        <Plus size={12} className="group-hover:scale-110 transition-transform" />
                      </span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <ReactFlow
            nodes={displayNodes}
            edges={displayEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onConnectStart={onConnectStart}
            onConnectEnd={onConnectEnd}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onSelectionChange={onSelectionChange}
            onNodeDragStart={onNodeDragStart}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            isValidConnection={isValidConnection}
            defaultEdgeOptions={FLOW_EDGE_DEFAULTS}
            connectionLineComponent={CustomConnectionLine}
            connectionLineType={edgeType === 'default' ? ConnectionLineType.Bezier : ConnectionLineType.SmoothStep}
            connectionLineStyle={{
              strokeWidth: 2.2,
              stroke: '#7b8794',
            }}
            fitView
            fitViewOptions={{ padding: 0.6 }}
            className="bg-slate-50"
            zoomOnDoubleClick={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#cbd5e1" gap={16} size={1} />
            <Controls
              position="bottom-right"
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                bottom: 'auto',
                transform: 'translateY(-50%)',
                margin: 0,
              }}
              className="border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col bg-white custom-controls-panel"
            >
              <button
                onClick={() => setEdgeType((t) => (t === 'default' ? 'smoothstep' : 'default'))}
                title={edgeType === 'default' ? 'Switch to Step Lines' : 'Switch to Curved Lines'}
                className="react-flow__controls-button flex items-center justify-center animate-in duration-75"
                style={{ order: -3 }}
              >
                {edgeType === 'default'
                  ? <Spline size={18} className="text-slate-700 mx-auto" />
                  : <Route size={18} className="text-slate-700 mx-auto" />
                }
              </button>
              <button
                onClick={() => handleAutoLayout('LR')}
                title="Horizontal Layout"
                className="react-flow__controls-button flex items-center justify-center"
                style={{ order: -2 }}
              >
                <GitFork size={18} className="rotate-90 text-slate-700 mx-auto" />
              </button>
              <button
                onClick={() => handleAutoLayout('TB')}
                title="Vertical Layout"
                className="react-flow__controls-button flex items-center justify-center"
                style={{ order: -1 }}
              >
                <GitFork size={18} className="text-slate-700 mx-auto" />
              </button>
            </Controls>
          </ReactFlow>

          {contextMenu && (
            <div
              className="fixed inset-0 z-50 overflow-hidden"
              onClick={() => setContextMenu(null)}
            >
              <div
                className="absolute bg-white border border-slate-200 p-2 rounded-2xl shadow-xl w-56 flex flex-col gap-0.5 select-none pointer-events-auto animate-in fade-in zoom-in-95 duration-150 z-50"
                style={{
                  left: Math.min(contextMenu.x, window.innerWidth - 240),
                  top: Math.min(contextMenu.y, window.innerHeight - 360),
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-3 pt-1 select-none">
                  Connect to:
                </span>
                {filteredContextMenuOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCreateAndConnectNode(opt.type)}
                    className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl text-left text-xs font-bold text-slate-700 transition-all cursor-pointer group select-none"
                  >
                    <span className="text-slate-850 font-bold">{opt.label}</span>
                    {opt.isPro && (
                      <span className="text-[8px] font-extrabold bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          <aside className={`absolute left-0 top-0 h-full w-80 border-r border-slate-200 bg-white z-20 flex flex-col justify-between overflow-visible shadow-2xl transition-all duration-300 ease-in-out ${
            selectedNodeId ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
          }`}>
            {activeNode && (
              activeNode.type === 'START_BROADCAST' ? (
                <div className="p-6 space-y-6 font-sans">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
                      <Send size={18} className="fill-indigo-100" />
                    </span>
                    <div>
                      <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest leading-none mb-1 block">
                        Editing Node
                      </span>
                      <h2 className="font-extrabold text-sm text-slate-850 uppercase tracking-wider block">
                        Trigger Settings
                      </h2>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4.5">
                    <p className="text-xs text-slate-550 leading-relaxed font-semibold">
                      This is the starting block of your broadcast campaign. It triggers sending your message to targeted subscribers when you click Send Now.
                    </p>
                  </div>
                </div>
              ) : (
                <NodeEditorPanel
                  node={activeNode}
                  onUpdateNodeData={handleUpdateNodeData}
                  editorState={editorState}
                  onSelectNode={setSelectedNodeId}
                />
              )
            )}

            <div className={`absolute left-0 top-0 h-full w-80 border-r border-slate-200 bg-white -z-10 flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-300 ease-in-out ${
              (editorState.isBtnDialogOpen || editorState.isNextStepDrawerOpen || editorState.isDataCollectionDrawerOpen) ? 'translate-x-full opacity-100' : 'translate-x-0 opacity-0 pointer-events-none'
            }`}>
              {activeNode && editorState.isNextStepDrawerOpen ? (
                <ChooseNextStepDrawer
                  onClose={() => {
                    editorState.setIsNextStepDrawerOpen(false);
                    if (editorState.setNextStepSourceHandle) {
                      editorState.setNextStepSourceHandle(null);
                    }
                  }}
                  onSelectStep={(type) => {
                    const handleId = editorState.nextStepSourceHandle || 'next';
                    handleAddAndConnectNode(activeNode.id, type, handleId);
                    editorState.setIsNextStepDrawerOpen(false);
                    if (editorState.setNextStepSourceHandle) {
                      editorState.setNextStepSourceHandle(null);
                    }
                  }}
                  isNested={editorState.isDataCollectionDrawerOpen || editorState.isBtnDialogOpen}
                />
              ) : activeNode && editorState.isDataCollectionDrawerOpen && editorState.editingDataCollectionBlock ? (
                <EditDataCollectionDrawer
                  onClose={() => editorState.setIsDataCollectionDrawerOpen(false)}
                  block={editorState.editingDataCollectionBlock}
                  onSave={editorState.handleUpdateDataCollection}
                  onRemove={() => {
                    if (editorState.editingDataCollectionBlock) {
                      const blockId = editorState.editingDataCollectionBlock.id;
                      const blocks = (activeNode.data.blocks || []) as FlowBlock[];
                      const updated = blocks.filter((b) => b.id !== blockId);
                      handleUpdateNodeData(activeNode.id, {
                        ...activeNode.data,
                        blocks: updated
                      });
                      setEdges((eds) => eds.filter((e) => !(e.source === activeNode.id && (e.sourceHandle === 'reply' || e.sourceHandle === 'timeout'))));
                    }
                    editorState.setIsDataCollectionDrawerOpen(false);
                  }}
                  edges={edges}
                  nodes={nodes}
                  nodeId={activeNode.id}
                  onUnlinkConnection={(handleId) => {
                    setEdges((eds) => eds.filter((e) => !(e.source === activeNode.id && e.sourceHandle === handleId)));
                  }}
                  onAddAndConnectNode={(sourceNodeId, type, sourceHandle) => {
                    handleAddAndConnectNode(sourceNodeId, type, sourceHandle);
                  }}
                  onOpenNextStepDrawer={(sourceHandle) => {
                    if (editorState.setNextStepSourceHandle) {
                      editorState.setNextStepSourceHandle(sourceHandle);
                    }
                    editorState.setIsNextStepDrawerOpen(true);
                  }}
                  customFields={customFields}
                  tags={tags}
                />
              ) : activeNode && editorState.isBtnDialogOpen && editorState.editingButton ? (
                <EditButtonDrawer
                  onClose={() => editorState.setIsBtnDialogOpen(false)}
                  button={editorState.editingButton}
                  onSave={editorState.handleSaveButton}
                  onRemove={editorState.handleRemoveButton}
                  edges={edges}
                  nodes={nodes}
                  nodeId={activeNode.id}
                  onUnlinkConnection={(btnValue) => {
                    setEdges((eds) => eds.filter((e) => !(e.source === activeNode.id && e.sourceHandle === btnValue)));
                  }}
                />
              ) : null}
            </div>
          </aside>

        </div>

        <AudiencePanel
          isAudienceOpen={isAudienceOpen}
          setIsAudienceOpen={setIsAudienceOpen}
          getAudienceCount={getAudienceCount}
          conditions={conditions}
          handleRemoveCondition={handleRemoveCondition}
          isConditionDropdownOpen={isConditionDropdownOpen}
          setIsConditionDropdownOpen={setIsConditionDropdownOpen}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          tags={tags}
          handleAddTagCondition={handleAddTagCondition}
          setConditions={setConditions}
          setIsDirty={setIsDirty}
          customFields={customFields}
          leads={leads}
          orders={orders}
        />
      </div>

      <FlowPreviewPanel
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        nodes={nodes}
        edges={edges}
        startNodeType="START_BROADCAST"
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleCampaign}
      />
      </div>
    </DashboardLayout>
  );
};

export const BroadcastBuilderPage: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ControlsStyles />
      <BroadcastBuilderInner />
    </ReactFlowProvider>
  );
};
