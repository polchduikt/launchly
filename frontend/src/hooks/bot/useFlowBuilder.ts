import { useState, useEffect, useRef, useMemo, useCallback, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactFlow } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import { useBotStore } from '../../store/useBotStore';
import { useFlowSchemaQuery, useSaveFlowSchemaMutation } from './useFlowSchema';
import { ROUTES } from '../../routes/paths';
import { getFlowKey, getFlowLogicKey } from '../../utils/flowHelpers';
import { useFlowHistory } from './useFlowHistory';
import { useFlowAutoSave } from './useFlowAutoSave';
import { useFlowContextMenu } from './useFlowContextMenu';
import { useFlowConnections } from './useFlowConnections';
import { useFlowState } from './useFlowState';
import { useFlowNodeActions } from './useFlowNodeActions';
import { useFlowClipboard } from './useFlowClipboard';
import { useFlowDrag } from './useFlowDrag';

export const useFlowBuilder = (isLocalChangeRef?: MutableRefObject<boolean>) => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { screenToFlowPosition, fitView } = useReactFlow();

  const { data: schema, isLoading: isLoadingSchema } = useFlowSchemaQuery(activeBotId || 0);
  const saveMutation = useSaveFlowSchemaMutation(activeBotId || 0);

  const setNodesProxyRef = useRef<(update: Node[] | ((nds: Node[]) => Node[])) => void>(() => {});
  const setEdgesProxyRef = useRef<(update: Edge[] | ((eds: Edge[]) => Edge[])) => void>(() => {});
  const setSelectedNodeIdProxyRef = useRef<(id: string | null) => void>(() => {});

  const setNodesProxy = useCallback((update: Node[] | ((nds: Node[]) => Node[])) => {
    setNodesProxyRef.current(update);
  }, []);

  const setEdgesProxy = useCallback((update: Edge[] | ((eds: Edge[]) => Edge[])) => {
    setEdgesProxyRef.current(update);
  }, []);

  const setSelectedNodeIdProxy = useCallback((id: string | null) => {
    setSelectedNodeIdProxyRef.current(id);
  }, []);

  const currentNodesRef = useRef<Node[]>([]);
  const currentEdgesRef = useRef<Edge[]>([]);

  const {
    past,
    future,
    setPast,
    setFuture,
    undo,
    redo,
    takeSnapshot,
    takeSnapshotBeforeEdit,
  } = useFlowHistory(
    currentNodesRef.current,
    currentEdgesRef.current,
    setNodesProxy as unknown as React.Dispatch<React.SetStateAction<Node[]>>,
    setEdgesProxy as unknown as React.Dispatch<React.SetStateAction<Edge[]>>,
    setSelectedNodeIdProxy as unknown as React.Dispatch<React.SetStateAction<string | null>>
  );

  const restoreTempRemovedEdgeRef = useRef<() => void>(() => {});
  const { contextMenu, setContextMenu } = useFlowContextMenu({
    onClose: () => restoreTempRemovedEdgeRef.current(),
  });

  const edgeTypeRef = useRef<'default' | 'smoothstep'>('default');

  const {
    isValidConnection,
    onConnect,
    onConnectStart,
    onConnectEnd,
    restoreTempRemovedEdge,
    tempRemovedEdgeRef,
    justEndedDragRef,
  } = useFlowConnections({
    nodes: currentNodesRef.current,
    edges: currentEdgesRef.current,
    setEdges: setEdgesProxy,
    edgeType: edgeTypeRef.current,
    takeSnapshot,
    screenToFlowPosition,
    setContextMenu,
  });
  restoreTempRemovedEdgeRef.current = restoreTempRemovedEdge;

  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesRaw,
    setEdgesRaw,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    edgeType,
    setEdgeType,
    startBatch,
    endBatch,
    onSelectionChange,
    onNodesChange,
    onEdgesChange,
    displayNodes,
    displayEdges,
  } = useFlowState({
    activeBotId,
    schema,
    isLoadingSchema,
    takeSnapshot,
    fitView,
    contextMenu,
    isLocalChangeRef,
  });

  currentNodesRef.current = nodes;
  currentEdgesRef.current = edges;
  setNodesProxyRef.current = setNodes;
  setEdgesProxyRef.current = setEdges;
  setSelectedNodeIdProxyRef.current = setSelectedNodeId;
  edgeTypeRef.current = edgeType;

  const {
    isDirty,
    setIsDirty,
    lastSavedKeyRef,
  } = useFlowAutoSave(activeBotId, nodes, edges, isLoadingSchema, saveMutation, isLocalChangeRef);

  const { onNodeDragStart, onNodeDragStop } = useFlowDrag({
    nodes,
    edges,
    setPast,
    setFuture,
    setIsDirty,
    isLocalChangeRef,
  });

  const {
    isAddDropdownOpen,
    setIsAddDropdownOpen,
    saveError,
    setSaveError,
    triggerSaveError,
    handleCreateAndConnectNode,
    handleUpdateNodeData,
    handleAddAndConnectNode,
    handleAddNode,
    handleDeleteSelectedNode,
    handleAutoLayout,
  } = useFlowNodeActions({
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    edgeType,
    contextMenu,
    setContextMenu,
    tempRemovedEdgeRef,
    takeSnapshot,
    takeSnapshotBeforeEdit,
    startBatch,
    endBatch,
    screenToFlowPosition,
    fitView,
    isLocalChangeRef,
  });

  const { copySelectedNodes, pasteCopiedNodes } = useFlowClipboard({
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    takeSnapshot,
    screenToFlowPosition,
  });

  const [publishedKey, setPublishedKey] = useState<string>('');
  const isInitialPublishedKeySetRef = useRef<boolean>(false);

  useEffect(() => {
    isInitialPublishedKeySetRef.current = false;
    setPublishedKey('');
  }, [activeBotId]);

  useEffect(() => {
    if (!isLoadingSchema && nodes.length > 0) {
      if (!isInitialPublishedKeySetRef.current) {
        isInitialPublishedKeySetRef.current = true;
        setPublishedKey(getFlowLogicKey(nodes, edges));
      }
    }
  }, [isLoadingSchema, nodes, edges]);

  const currentFlowLogicKey = useMemo(() => getFlowLogicKey(nodes, edges), [nodes, edges]);
  const hasUnpublishedChanges = useMemo(() => {
    if (!isInitialPublishedKeySetRef.current || !publishedKey) return false;
    return currentFlowLogicKey !== publishedKey;
  }, [currentFlowLogicKey, publishedKey]);

  useEffect(() => {
    if (!activeBotId) {
      navigate(ROUTES.HOME);
    }
  }, [activeBotId, navigate]);

  const handleSaveFlow = () => {
    setSaveError(null);

    const startCount = nodes.filter((n) => n.type === 'START').length;
    if (startCount !== 1) {
      triggerSaveError('Flow must have exactly one START node');
      return false;
    }

    saveMutation.mutate({
      nodes,
      edges,
    });
    const key = getFlowKey(nodes, edges);
    lastSavedKeyRef.current = key;
    setIsDirty(false);
    return true;
  };

  const onPaneClick = useCallback(() => {
    if (justEndedDragRef.current) return;
    setSelectedNodeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setContextMenu, justEndedDragRef]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesRemote: setNodesRaw,
    setEdgesRemote: setEdgesRaw,
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
    setSaveError,
    isAddDropdownOpen,
    setIsAddDropdownOpen,
    contextMenu,
    setContextMenu,
    handleCreateAndConnectNode,
    handleUpdateNodeData,
    handleAddNode,
    handleAddAndConnectNode,
    handleDeleteSelectedNode,
    handleAutoLayout,
    handleSaveFlow,
    startBatch,
    endBatch,
    selectedNode,
    saveMutation,
    isLoadingSchema,
    onSelectionChange,
    onPaneClick,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    takeSnapshot,
    isDirty,
    hasUnpublishedChanges,
    setPublishedKey,
    copySelectedNodes,
    pasteCopiedNodes,
    isValidConnection,
  };
};
