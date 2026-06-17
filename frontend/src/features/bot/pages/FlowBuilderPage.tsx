import React from 'react';
import { useNavigate } from 'react-router-dom';
import {ReactFlow, Controls, Background, ReactFlowProvider, getBezierPath, getSmoothStepPath, ConnectionLineType,} from '@xyflow/react';
import type { ConnectionLineComponentProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../hooks/useBotsQuery';
import { NodeEditorPanel } from '../components/sidebar/NodeEditorPanel';
import { FLOW_BLOCKS } from '../config/flowBlocks';
import { DashboardLayout } from '../../../components/layouts/DashboardLayout';
import { NODE_TYPES } from '../config/nodeTypes';
import { FLOW_EDGE_DEFAULTS } from '../config/flowEdges';
import { CONTEXT_MENU_OPTIONS } from '../config/contextMenuOptions';
import { useFlowBuilder } from '../hooks/useFlowBuilder';
import { ROUTES } from '../../../constants/routes';
import { ArrowLeft, Loader2, Plus, Trash2, GitFork, Route, GitCommit, Undo2, Redo2 } from 'lucide-react';
import { useAiStore } from '../../../store/useAiStore';
import { useEffect } from 'react';

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
  let edgePath = '';

  if (connectionLineType === 'smoothstep') {
    const [path] = getSmoothStepPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition: toPosition,
    });
    edgePath = path;
  } else {
    const [path] = getBezierPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition: toPosition,
    });
    edgePath = path;
  }

  return (
    <g>
      <path
        fill="none"
        stroke="#7b8794"
        strokeWidth={1.6}
        d={edgePath}
        style={{
          ...connectionLineStyle,
          markerEnd: 'url(#custom-connection-arrow)',
        }}
      />
    </g>
  );
};

const FlowBuilderInner: React.FC = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);

  const {
    nodes,
    setNodes,
    setEdges,
    displayNodes,
    displayEdges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStart,
    onNodeDragStop,
    onConnect,
    onConnectStart,
    onConnectEnd,
    selectedNodeId,
    setSelectedNodeId,
    edgeType,
    setEdgeType,
    saveError,
    isAddDropdownOpen,
    setIsAddDropdownOpen,
    contextMenu,
    setContextMenu,
    handleCreateAndConnectNode,
    handleUpdateNodeData,
    handleAddNode,
    handleDeleteSelectedNode,
    handleAutoLayout,
    handleSaveFlow,
    selectedNode,
    saveMutation,
    justEndedDrag,
    undo,
    redo,
    canUndo,
    canRedo,
    takeSnapshot,
    isDirty,
  } = useFlowBuilder();

  const { setOnGenerate, setHasExistingNodes } = useAiStore();

  useEffect(() => {
    setOnGenerate((newNodes, newEdges) => {
      takeSnapshot();
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedNodeId(null);
    });
    return () => {
      setOnGenerate(null);
    };
  }, [setOnGenerate, setNodes, setEdges, setSelectedNodeId, takeSnapshot]);

  useEffect(() => {
    setHasExistingNodes(nodes.length > 1 || (nodes.length === 1 && nodes[0].type !== 'START'));
  }, [nodes, setHasExistingNodes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      );
      
      if (isTyping) return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);

  const { data: bots = [] } = useBotsQuery();
  const activeBot = bots.find((b) => b.id === activeBotId);
  const isBotLive = activeBot?.active ?? false;

  return (
    <DashboardLayout>
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <marker
            id="custom-connection-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#7b8794" />
          </marker>
        </defs>
      </svg>
      <div className="h-full w-full flex flex-col bg-slate-50 font-sans overflow-hidden">
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex justify-between items-center z-10 shrink-0 select-none">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(ROUTES.AUTOMATIONS)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
              <span>Automations</span>
              <span>&gt;</span>
              <span className="text-slate-800 font-bold text-sm">Telegram Flow Schema</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {saveError && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 border border-rose-100 rounded-lg animate-pulse mr-1">
                {saveError}
              </span>
            )}

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-3.5 py-1.5 rounded-2xl font-sans">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 min-w-[85px] justify-start select-none">
                {isDirty || saveMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin text-indigo-500 shrink-0" size={14} />
                    <span className="text-slate-400">Saving...</span>
                  </>
                ) : saveMutation.isError ? (
                  <>
                    <span className="text-rose-500 shrink-0 font-bold">✕</span>
                    <span className="text-rose-500">Failed</span>
                  </>
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
              onClick={handleSaveFlow}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow shadow-indigo-100 cursor-pointer"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isBotLive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  <span>Set Live</span>
                </>
              )}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 relative h-full">
            <ReactFlow
              nodes={displayNodes}
              edges={displayEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={NODE_TYPES}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => {
                if (justEndedDrag) return;
                setSelectedNodeId(null);
                setContextMenu(null);
              }}
              defaultEdgeOptions={FLOW_EDGE_DEFAULTS}
              connectionLineStyle={{
                strokeWidth: 1.6,
                stroke: '#7b8794',
              }}
              connectionLineComponent={CustomConnectionLine}
              connectionLineType={edgeType === 'default' ? ConnectionLineType.Bezier : ConnectionLineType.SmoothStep}
              fitView
              fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
              proOptions={{ hideAttribution: true }}
              className="bg-slate-50"
              zoomOnDoubleClick={false}
            >
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
                  title="Toggle Edge Style (Bezier / Straight)"
                  className="react-flow__controls-button"
                  style={{ order: -3 }}
                >
                  {edgeType === 'default' ? (
                    <Route size={18} className="text-slate-700" />
                  ) : (
                    <GitCommit size={18} className="text-slate-700" />
                  )}
                </button>
                <button
                  onClick={() => handleAutoLayout('LR')}
                  title="Horizontal Layout"
                  className="react-flow__controls-button"
                  style={{ order: -2 }}
                >
                  <GitFork size={18} className="rotate-90 text-slate-700" />
                </button>
                <button
                  onClick={() => handleAutoLayout('TB')}
                  title="Vertical Layout"
                  className="react-flow__controls-button"
                  style={{ order: -1 }}
                >
                  <GitFork size={18} className="text-slate-700" />
                </button>
              </Controls>
              <Background color="#cbd5e1" gap={16} size={1} />
            </ReactFlow>

            <aside className={`absolute left-0 top-0 h-full w-80 border-r border-slate-200 bg-white z-20 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ease-in-out ${
              selectedNodeId ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
            }`}>
              {selectedNode && (
                <NodeEditorPanel node={selectedNode} onUpdateNodeData={handleUpdateNodeData} />
              )}
            </aside>
            {selectedNodeId && (
              <div className="absolute top-4 left-[336px] z-10 flex flex-col gap-3 pointer-events-auto transition-all duration-300 ease-in-out">
                <button
                  onClick={handleDeleteSelectedNode}
                  className="flex items-center justify-center gap-1.5 w-48 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-2xl border border-rose-100 shadow-sm transition-all cursor-pointer animate-in fade-in duration-200"
                >
                  <Trash2 size={14} />
                  <span>Delete Block</span>
                </button>
              </div>
            )}

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
                    {FLOW_BLOCKS.map((item) => (
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
                  {CONTEXT_MENU_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCreateAndConnectNode(opt.type)}
                      className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl text-left text-xs font-bold text-slate-700 transition-all cursor-pointer group select-none"
                    >
                      <span className="text-slate-800 font-semibold">{opt.label}</span>
                      {opt.isPro && (
                        <span className="text-[8px] font-extrabold bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                          PRO
                        </span>
                      )}
                      {opt.isAi && (
                        <span className="text-[8px] font-extrabold bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase tracking-wider scale-90">
                          AI
                        </span>
                      )}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setContextMenu(null)}
                    className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-all border-t border-slate-100 mt-2.5 cursor-pointer pt-2 select-none"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </DashboardLayout>
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

export const FlowBuilderPage: React.FC = () => {
  const activeBotId = useBotStore((state) => state.activeBotId);

  if (!activeBotId) {
    return null;
  }

  return (
    <ReactFlowProvider>
      <ControlsStyles />
      <FlowBuilderInner />
    </ReactFlowProvider>
  );
};
