import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../../i18n/config';
import { ReactFlow, Controls, Background, ReactFlowProvider, getBezierPath, getSmoothStepPath, ConnectionLineType } from '@xyflow/react';
import type { ConnectionLineComponentProps, Edge, Node, OnNodeDrag } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useBotStore } from '../../../store/useBotStore';
import { useBotsQuery } from '../../../hooks/bot/useBotsQuery';
import { getCustomFieldsApi } from '../../../api/bot';
import { NodeEditorPanel } from './components/sidebar/NodeEditorPanel';
import { FLOW_BLOCKS } from '../../../const/flowBlocks';
import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { NODE_TYPES } from '../../../const/nodeTypes';
import { FLOW_EDGE_DEFAULTS, EDGE_TYPES } from '../../../const/flowEdges';
import { CONTEXT_MENU_OPTIONS } from '../../../const/contextMenuOptions';
import { useFlowBuilder } from '../../../hooks/bot/useFlowBuilder';
import { ROUTES } from '../../../routes/paths';
import { ArrowLeft, Loader2, Plus, GitFork, Route, GitCommit, Undo2, Redo2, Sparkles, Eye } from 'lucide-react';
import { useState } from 'react';
import { FlowPreviewPanel } from '../../../components/common/FlowPreviewPanel';
import { useAiStore } from '../../../store/useAiStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useNodeEditor } from '../../../hooks/bot/useNodeEditor';
import { EditButtonDrawer } from './components/sidebar/drawers/EditButtonDrawer';
import { ChooseNextStepDrawer } from './components/sidebar/drawers/ChooseNextStepDrawer';
import { AiAssistantDrawer } from '../../../components/common/AiAssistantDrawer';
import { EditDataCollectionDrawer } from './components/sidebar/drawers/EditDataCollectionDrawer';
import { useTagsQuery } from '../../../hooks/broadcast/useBroadcastQueries';
import type { FlowBlock } from "../../../types/bot";
import { useFlowCollaboration } from '../../../hooks/bot/useFlowCollaboration';

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

const FlowBuilderInner: React.FC = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { data: tags = [] } = useTagsQuery(activeBotId || 0);
  const [customFields, setCustomFields] = useState<string[]>(['last_order_product', 'last_order_price', 'phone', 'email']);

  useEffect(() => {
    if (activeBotId) {
      getCustomFieldsApi(activeBotId)
        .then((data) => {
          if (data && typeof data === 'object') {
            const list = Array.isArray(data.fields) ? data.fields : Array.isArray(data) ? data : [];
            const names = list.map((f: any) => typeof f === 'string' ? f : f?.name).filter(Boolean);
            if (names.length > 0) setCustomFields(names);
          }
        })
        .catch((err) => console.error('Failed to load custom fields:', err));
    }
  }, [activeBotId]);

  const isLocalChangeRef = useRef(false);

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesRemote,
    setEdgesRemote,
    displayNodes,
    displayEdges,
    onNodesChange,
    onEdgesChange,
    onSelectionChange,
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
    handleAddAndConnectNode,
    handleAutoLayout,
    handleSaveFlow,
    selectedNode,
    saveMutation,
    onPaneClick,
    undo,
    redo,
    canUndo,
    canRedo,
    takeSnapshot,
    isDirty,
    copySelectedNodes,
    pasteCopiedNodes,
    isValidConnection,
  } = useFlowBuilder(isLocalChangeRef);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const currentUser = useAuthStore((state) => state.user);
  const {
    collaborators,
    activeAction,
    updateLocalAction,
    publishNodeMove,
    publishNodeMoveForce,
    setDragging,
  } = useFlowCollaboration(activeBotId || 0, nodes, edges, setNodesRemote, setEdgesRemote, 'flow', isLocalChangeRef);

  const handleNodeDragStart: OnNodeDrag<Node> = useCallback((_evt, node) => {
    onNodeDragStart();
    setDragging(true);
    updateLocalAction(`${currentUser?.name || 'Someone'} is dragging...`, node.id);
  }, [onNodeDragStart, updateLocalAction, currentUser, setDragging]);

  const handleNodeDrag: OnNodeDrag<Node> = useCallback((_evt, node) => {
    publishNodeMove(node.id, node.position);
  }, [publishNodeMove]);

  const handleNodeDragStop: OnNodeDrag<Node> = useCallback((_evt, node) => {
    onNodeDragStop();
    publishNodeMoveForce(node.id, node.position);
    setDragging(false);
    updateLocalAction(null, null);
  }, [onNodeDragStop, updateLocalAction, setDragging, publishNodeMoveForce]);

  useEffect(() => {
    if (selectedNodeId) {
      const selectedNodeObj = nodes.find((n) => n.id === selectedNodeId);
      const nodeName = (selectedNodeObj?.data?.label as string) || selectedNodeObj?.type || 'block';
      updateLocalAction(
        `${currentUser?.name || 'Someone'} is editing ${nodeName}...`,
        selectedNodeId
      );
    } else {
      updateLocalAction(null, null);
    }
  }, [selectedNodeId, currentUser, updateLocalAction]);
  const nodesWithCollaborators = useMemo(() => {
    const collaboratorMap = new Map(collaborators.map(c => [c.editingNodeId, c]));
    let hasChanges = false;
    
    const result = displayNodes.map((node) => {
      const activeCollab = collaboratorMap.get(node.id);
      if (activeCollab) {
        hasChanges = true;
        return {
          ...node,
          data: {
            ...node.data,
            _collaborator: {
              name: activeCollab.name,
              avatar: activeCollab.avatar,
            },
          },
        };
      }
      return node;
    });
    
    return hasChanges ? result : displayNodes;
  }, [displayNodes, collaborators]);

  const { data: userBotsList = [] } = useBotsQuery();
  const currentBot = useMemo(() => userBotsList.find((b) => b.id === activeBotId), [userBotsList, activeBotId]);

  useEffect(() => {
    if (currentBot && currentBot.blocked) {
      alert(`Автоматизацію заблоковано адміністрацією. Причина: ${currentBot.blockReason || 'Порушення правил платформи'}`);
      navigate(ROUTES.AUTOMATIONS, { replace: true });
    }
  }, [currentBot, navigate]);

  const filteredContextMenuOptions = useMemo(() => {
    if (!contextMenu) return CONTEXT_MENU_OPTIONS;
    const handleId = contextMenu.source.handleId;
    if (handleId === 'reply') {
      return CONTEXT_MENU_OPTIONS.filter((opt) => opt.type === 'ACTION');
    }
    if (handleId === 'timeout') {
      return CONTEXT_MENU_OPTIONS.filter((opt) => opt.type !== 'ACTION');
    }
    return CONTEXT_MENU_OPTIONS;
  }, [contextMenu]);

  const editorState = useNodeEditor(
    selectedNode,
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

  const { setOnGenerate, setHasExistingNodes } = useAiStore();

  useEffect(() => {
    setOnGenerate((newNodes, newEdges) => {
      takeSnapshot();
      setNodes(newNodes as Node[]);
      setEdges(newEdges as Edge[]);
      setSelectedNodeId(null);
    });
    return () => {
      setOnGenerate(null);
    };
  }, [setOnGenerate, setNodes, setEdges, setSelectedNodeId, takeSnapshot]);

  useEffect(() => {
    setHasExistingNodes(nodes.length > 1 || (nodes.length === 1 && nodes[0].type !== 'START'));
  }, [nodes, setHasExistingNodes]);

  const undoRef = useRef(undo);
  const redoRef = useRef(redo);
  const copyRef = useRef(copySelectedNodes);
  const pasteRef = useRef(pasteCopiedNodes);

  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
    copyRef.current = copySelectedNodes;
    pasteRef.current = pasteCopiedNodes;
  });

  const { data: bots = [] } = useBotsQuery();
  const activeBot = bots.find((b) => b.id === activeBotId);
  const isBotLive = activeBot?.active ?? false;
  const isViewer = activeBot?.role === 'Viewer';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isViewer) return;
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
  }, [isViewer]);

  return (
    <DashboardLayout>
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
              <span>{t('flow_builder.automations')}</span>
              <span>&gt;</span>
              <span className="text-slate-800 font-bold text-sm">{t('flow_builder.telegram_flow_schema')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {saveError && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 border border-rose-100 rounded-lg animate-pulse mr-1">
                {saveError}
              </span>
            )}

            {activeAction && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-150 rounded-2xl text-[10px] text-indigo-700 font-extrabold shadow-3xs animate-in slide-in-from-right-2 duration-300 max-w-[240px] truncate select-none">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
                <span className="truncate">{activeAction}</span>
              </div>
            )}


            {collaborators.length > 0 && (
              <div className="flex items-center -space-x-1.5 select-none relative group">
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80"}
                  alt={currentUser?.name || "Me"}
                  title={`${currentUser?.name || "Me"} (You)`}
                  className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-100"
                />
                {collaborators.map((c) => (
                  <div key={c.userId} className="relative">
                    <img
                      src={c.avatar || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80"}
                      alt={c.name}
                      title={`${c.name} (Online)`}
                      className={`w-6 h-6 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-slate-100 transition-all ${
                        c.action ? 'ring-2 ring-indigo-500 ring-offset-1 scale-105' : ''
                      }`}
                    />
                    {c.action && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 bg-indigo-500 rounded-full border border-white animate-ping" />
                    )}
                  </div>
                ))}
              </div>
            )}


            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-3.5 py-1.5 rounded-2xl font-sans">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 min-w-[85px] justify-start select-none">
                {isDirty || saveMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin text-indigo-500 shrink-0" size={14} />
                    <span className="text-slate-400">{t('flow_builder.saving')}</span>
                  </>
                ) : saveMutation.isError ? (
                  <>
                    <span className="text-rose-500 shrink-0 font-bold">✕</span>
                    <span className="text-rose-500">{t('flow_builder.failed')}</span>
                  </>
                ) : (
                  <>
                    <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                    <span className="text-slate-500">{t('flow_builder.saved')}</span>
                  </>
                )}
              </div>

              <div className="w-[1px] h-4 bg-slate-200" />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={undo}
                  disabled={isViewer || !canUndo}
                  title="Undo (Ctrl+Z)"
                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Undo2 size={15} />
                </button>
                <button
                  onClick={redo}
                  disabled={isViewer || !canRedo}
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
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer shadow-3xs ${
                isPreviewOpen
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Preview flow"
            >
              <Eye size={14} />
              <span>{isPreviewOpen ? t('flow_builder.close_preview') : t('flow_builder.preview')}</span>
            </button>

            {!isViewer && (
              <button
                onClick={() => {
                  useAiStore.getState().setIsOpen(true);
                  useAiStore.getState().setActiveTab('generator');
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-100 cursor-pointer shadow-3xs"
                title="Generate flow with AI"
              >
                <Sparkles size={14} className="animate-pulse" />
                <span>{t('flow_builder.ai_gen')}</span>
              </button>
            )}

            {!isViewer && (
              <button
                onClick={handleSaveFlow}
                disabled={saveMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow shadow-indigo-100 cursor-pointer"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>{t('flow_builder.saving')}</span>
                  </>
                ) : (
                  <>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isBotLive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    <span>{t('flow_builder.set_live')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </header>


        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 relative h-full">
            <ReactFlow
              nodes={nodesWithCollaborators}
              edges={displayEdges}
              onNodesChange={isViewer ? undefined : onNodesChange}
              onEdgesChange={isViewer ? undefined : onEdgesChange}
              onConnect={isViewer ? undefined : onConnect}
              onSelectionChange={onSelectionChange}
              onConnectStart={isViewer ? undefined : onConnectStart}
              onConnectEnd={isViewer ? undefined : onConnectEnd}
              onNodeDragStart={isViewer ? undefined : handleNodeDragStart}
              onNodeDrag={isViewer ? undefined : handleNodeDrag}
              onNodeDragStop={isViewer ? undefined : handleNodeDragStop}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              onNodeClick={isViewer ? undefined : (_, node) => setSelectedNodeId(node.id)}
              onPaneClick={isViewer ? undefined : onPaneClick}
              isValidConnection={isValidConnection}
              defaultEdgeOptions={FLOW_EDGE_DEFAULTS}
              connectionLineStyle={{
                strokeWidth: 2.2,
                stroke: '#7b8794',
              }}
              connectionLineComponent={CustomConnectionLine}
              connectionLineType={edgeType === 'default' ? ConnectionLineType.Bezier : ConnectionLineType.SmoothStep}
              nodesDraggable={!isViewer}
              nodesConnectable={!isViewer}
              elementsSelectable={!isViewer}
              deleteKeyCode={isViewer ? null : ['Backspace', 'Delete']}
              fitView
              fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
              proOptions={{ hideAttribution: true }}
              className="bg-slate-50"
              zoomOnDoubleClick={false}
              multiSelectionKeyCode="Control"
              selectionKeyCode="Control"
              onlyRenderVisibleElements={nodes.length > 100}
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

            <aside className={`absolute left-0 top-0 h-full w-80 border-r border-slate-200 bg-white z-20 flex flex-col justify-between overflow-visible shadow-2xl transition-all duration-300 ease-in-out ${
              selectedNodeId ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
            }`}>
              {selectedNode && (
                <NodeEditorPanel
                  node={selectedNode}
                  onUpdateNodeData={handleUpdateNodeData}
                  editorState={editorState}
                  onSelectNode={setSelectedNodeId}
                />
              )}

              <div className={`absolute left-0 top-0 h-full w-80 border-r border-slate-200 bg-white -z-10 flex flex-col justify-between overflow-hidden shadow-xl transition-all duration-300 ease-in-out ${
                (editorState.isBtnDialogOpen || editorState.isNextStepDrawerOpen || editorState.isDataCollectionDrawerOpen) ? 'translate-x-full opacity-100' : 'translate-x-0 opacity-0 pointer-events-none'
              }`}>
                {selectedNode && editorState.isNextStepDrawerOpen ? (
                  <ChooseNextStepDrawer
                    onClose={() => {
                      editorState.setIsNextStepDrawerOpen(false);
                      if (editorState.setNextStepSourceHandle) {
                        editorState.setNextStepSourceHandle(null);
                      }
                    }}
                    onSelectStep={(type) => {
                      const handleId = editorState.nextStepSourceHandle || 'next';
                      handleAddAndConnectNode(selectedNode.id, type, handleId);
                      editorState.setIsNextStepDrawerOpen(false);
                      if (editorState.setNextStepSourceHandle) {
                        editorState.setNextStepSourceHandle(null);
                      }
                    }}
                    isNested={editorState.isDataCollectionDrawerOpen || editorState.isBtnDialogOpen}
                  />
                ) : selectedNode && editorState.isDataCollectionDrawerOpen && editorState.editingDataCollectionBlock ? (
                  <EditDataCollectionDrawer
                    onClose={() => editorState.setIsDataCollectionDrawerOpen(false)}
                    block={editorState.editingDataCollectionBlock}
                    onSave={editorState.handleUpdateDataCollection}
                    onRemove={() => {
                      if (editorState.editingDataCollectionBlock) {
                        const blockId = editorState.editingDataCollectionBlock.id;
                        const blocks = (selectedNode.data.blocks || []) as FlowBlock[];
                        const updated = blocks.filter((b) => b.id !== blockId);
                        handleUpdateNodeData(selectedNode.id, {
                          ...selectedNode.data,
                          blocks: updated
                        });
                        setEdges((eds) => eds.filter((e) => !(e.source === selectedNode.id && (e.sourceHandle === 'reply' || e.sourceHandle === 'timeout'))));
                      }
                      editorState.setIsDataCollectionDrawerOpen(false);
                    }}
                    edges={edges}
                    nodes={nodes}
                    nodeId={selectedNode.id}
                    onUnlinkConnection={(handleId) => {
                      setEdges((eds) => eds.filter((e) => !(e.source === selectedNode.id && e.sourceHandle === handleId)));
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
                ) : selectedNode && editorState.isBtnDialogOpen && editorState.editingButton ? (
                  <EditButtonDrawer
                    onClose={() => editorState.setIsBtnDialogOpen(false)}
                    button={editorState.editingButton}
                    onSave={editorState.handleSaveButton}
                    onRemove={editorState.handleRemoveButton}
                    edges={edges}
                    nodes={nodes}
                    nodeId={selectedNode.id}
                    onUnlinkConnection={(btnValue) => {
                      setEdges((eds) => eds.filter((e) => !(e.source === selectedNode.id && e.sourceHandle === btnValue)));
                    }}
                  />
                ) : null}
              </div>
            </aside>

            {!isViewer && (
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
                        {t('flow_builder.add_standalone_node')}
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
            )}

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
                    {t('flow_builder.connect_to')}
                  </span>
                  {filteredContextMenuOptions.map((opt, idx) => (
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
                    {t('flow_builder.cancel')}
                  </button>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
      <AiAssistantDrawer />
      <FlowPreviewPanel
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        nodes={nodes}
        edges={edges}
        startNodeType="START"
      />
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
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);

  useEffect(() => {
    if (!activeBotId) {
      navigate(ROUTES.AUTOMATIONS, { replace: true });
    }
  }, [activeBotId, navigate]);

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
