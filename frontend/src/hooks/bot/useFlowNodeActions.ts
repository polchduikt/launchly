import { useState, useCallback, useRef, useEffect, type MutableRefObject } from 'react';
import { addEdge } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import { FLOW_EDGE_DEFAULTS } from '../../const/flowEdges';
import { createDefaultNodeData } from '../../const/flowBlocks';
import { getAutoLayoutedElements } from '../../utils/flowLayout';
import { getNodesAfterRemovingEdges } from '../../utils/flowHelpers';
import type { FlowContextMenuState } from './useFlowContextMenu';

interface UseFlowNodeActionsParams {
  nodes: Node[];
  edges: Edge[];
  setNodes: (update: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (update: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  edgeType: 'default' | 'smoothstep';
  contextMenu: FlowContextMenuState | null;
  setContextMenu: (val: FlowContextMenuState | null) => void;
  tempRemovedEdgeRef: MutableRefObject<Edge | null>;
  takeSnapshot: () => void;
  takeSnapshotBeforeEdit: () => void;
  startBatch: () => void;
  endBatch: () => void;
  screenToFlowPosition: (clientPos: { x: number; y: number }) => { x: number; y: number };
  fitView: (opts?: Record<string, unknown>) => void;
  isLocalChangeRef?: MutableRefObject<boolean>;
}

export const useFlowNodeActions = ({
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
}: UseFlowNodeActionsParams) => {
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSaveError = useCallback((msg: string) => {
    setSaveError(msg);
    if (saveErrorTimeoutRef.current) {
      clearTimeout(saveErrorTimeoutRef.current);
    }
    saveErrorTimeoutRef.current = setTimeout(() => {
      setSaveError(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (saveErrorTimeoutRef.current) {
        clearTimeout(saveErrorTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateAndConnectNode = useCallback(
    (type: string) => {
      if (!contextMenu) return;
      const { flowPosition, source } = contextMenu;

      if (type === 'START') {
        const hasStart = nodes.some((n) => n.type === 'START');
        if (hasStart) {
          triggerSaveError('Flow must have exactly one START node');
          setContextMenu(null);
          return;
        }
      }

      takeSnapshot();
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      const newNodeId = `node_${type.toLowerCase()}_${Date.now()}`;
      const newNode: Node = {
        id: newNodeId,
        type,
        position: flowPosition,
        data: createDefaultNodeData(type),
        selected: true,
      };

      let sourceHandle = source.handleType === 'source' ? source.handleId : null;
      if (source.handleType === 'target') {
        sourceHandle = type === 'START' ? 'then' : 'next';
      } else if (!sourceHandle) {
        const srcNode = nodes.find((n) => n.id === source.nodeId);
        sourceHandle = srcNode?.type === 'START' ? 'then' : 'next';
      }

      const newEdge: Edge = {
        ...FLOW_EDGE_DEFAULTS,
        id: `edge_${Date.now()}`,
        source: source.handleType === 'source' ? source.nodeId : newNodeId,
        sourceHandle,
        target: source.handleType === 'target' ? source.nodeId : newNodeId,
        targetHandle: source.handleType === 'target' ? source.handleId : null,
        type: edgeType,
      };

      tempRemovedEdgeRef.current = null;
      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false }) as Node), newNode]);
      setEdges((eds) => {
        const filtered = eds.filter((e) => !(e.source === newEdge.source && e.sourceHandle === newEdge.sourceHandle));
        return addEdge(newEdge, filtered);
      });
      setSelectedNodeId(newNodeId);
      setContextMenu(null);
    },
    [
      contextMenu,
      nodes,
      edgeType,
      setNodes,
      setEdges,
      setSelectedNodeId,
      setContextMenu,
      tempRemovedEdgeRef,
      takeSnapshot,
      triggerSaveError,
      isLocalChangeRef,
    ]
  );

  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      takeSnapshotBeforeEdit();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: newData };
          }
          return node;
        })
      );
    },
    [setNodes, takeSnapshotBeforeEdit, isLocalChangeRef]
  );

  const handleAddAndConnectNode = useCallback(
    (sourceNodeId: string, type: string, sourceHandle?: string) => {
      takeSnapshot();
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      const id = `node_${type.toLowerCase()}_${Date.now()}`;
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);

      const position = sourceNode
        ? { x: sourceNode.position.x + 350, y: sourceNode.position.y }
        : { x: Math.random() * 200 + 150, y: Math.random() * 200 + 100 };

      const newNode: Node = {
        id,
        type,
        position,
        data: createDefaultNodeData(type),
        selected: true,
      };

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false }) as Node), newNode]);

      const actualSourceHandle = sourceHandle || (sourceNode?.type === 'START' ? 'then' : 'next');

      const newEdge: Edge = {
        ...FLOW_EDGE_DEFAULTS,
        id: `edge_${sourceNodeId}_${actualSourceHandle}_${id}`,
        source: sourceNodeId,
        sourceHandle: actualSourceHandle,
        target: id,
        type: edgeType,
      };

      setEdges((eds) => [
        ...eds.filter((e) => !(e.source === sourceNodeId && e.sourceHandle === actualSourceHandle)),
        newEdge,
      ]);
      setSelectedNodeId(id);

      setTimeout(() => {
        fitView({ nodes: [{ id }], duration: 300, padding: 0.5 });
      }, 50);
    },
    [nodes, setNodes, setEdges, edgeType, takeSnapshot, fitView, setSelectedNodeId, isLocalChangeRef]
  );

  const handleAddNode = useCallback(
    (type: string) => {
      if (type === 'START') {
        const hasStart = nodes.some((n) => n.type === 'START');
        if (hasStart) {
          triggerSaveError('Flow must have exactly one START node');
          return;
        }
      }

      takeSnapshot();
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      const id = `node_${type.toLowerCase()}_${Date.now()}`;
      const viewportCenter = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });

      const newNode: Node = {
        id,
        type,
        position: viewportCenter,
        data: createDefaultNodeData(type),
        selected: true,
      };

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false }) as Node), newNode]);
      setSelectedNodeId(id);
    },
    [nodes, screenToFlowPosition, setNodes, setSelectedNodeId, takeSnapshot, triggerSaveError, isLocalChangeRef]
  );

  const handleDeleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
    if (nodeToDelete?.type === 'START') {
      triggerSaveError('You cannot delete the START node');
      return;
    }

    takeSnapshot();
    if (isLocalChangeRef) {
      isLocalChangeRef.current = true;
    }
    const removedEdges = edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
    const nextNodes = getNodesAfterRemovingEdges(
      nodes.filter((n) => n.id !== selectedNodeId),
      removedEdges
    );
    setNodes(nextNodes);
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, nodes, edges, setNodes, setEdges, setSelectedNodeId, takeSnapshot, triggerSaveError, isLocalChangeRef]);

  const handleAutoLayout = useCallback(
    (direction: 'LR' | 'TB') => {
      takeSnapshot();
      startBatch();
      const layouted = getAutoLayoutedElements(nodes, edges, direction);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      setTimeout(() => {
        endBatch();
      }, 0);
    },
    [nodes, edges, setNodes, setEdges, startBatch, endBatch, takeSnapshot]
  );

  return {
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
  };
};
