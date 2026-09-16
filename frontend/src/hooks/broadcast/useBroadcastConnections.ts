import { useState, useEffect, useCallback, useRef, type SetStateAction } from 'react';
import { addEdge, type Edge, type Connection } from '@xyflow/react';
import type { CustomNode } from '../../types/broadcast';
import { FLOW_EDGE_DEFAULTS } from '../../const/flowEdges';
import { STORAGE_KEYS } from '../../const/constants';

interface UseBroadcastConnectionsProps {
  nodes: CustomNode[];
  edges: Edge[];
  setNodes: (update: SetStateAction<CustomNode[]>) => void;
  setEdges: (update: SetStateAction<Edge[]>) => void;
  takeSnapshot: () => void;
  screenToFlowPosition: (clientPosition: { x: number; y: number }) => { x: number; y: number };
  setSelectedNodeId: (id: string | null) => void;
  getDefaultNodeData: (type: string) => Record<string, unknown>;
}

export const useBroadcastConnections = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  takeSnapshot,
  screenToFlowPosition,
  setSelectedNodeId,
  getDefaultNodeData,
}: UseBroadcastConnectionsProps) => {
  const connectionStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string } | null>(null);
  const didConnectRef = useRef<boolean>(false);
  const justEndedDragRef = useRef<boolean>(false);
  const tempRemovedEdgeRef = useRef<Edge | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    source: { nodeId: string; handleId: string | null; handleType: string };
  } | null>(null);

  const [edgeType, setEdgeType] = useState<'default' | 'smoothstep'>(
    (localStorage.getItem(STORAGE_KEYS.FLOW_EDGE_TYPE) as 'default' | 'smoothstep') || 'smoothstep'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FLOW_EDGE_TYPE, edgeType);
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        type: edgeType,
      }))
    );
  }, [edgeType, setEdges]);

  useEffect(() => {
    const handleHover = (e: Event) => {
      const customEvent = e as CustomEvent<{ edgeId: string; source: string; target: string } | null>;
      if (customEvent.detail) {
        setHoveredEdgeId(customEvent.detail.edgeId);
      } else {
        setHoveredEdgeId(null);
      }
    };
    window.addEventListener('flow-hover-edge', handleHover);
    return () => {
      window.removeEventListener('flow-hover-edge', handleHover);
    };
  }, []);

  const restoreTempRemovedEdge = useCallback(() => {
    if (tempRemovedEdgeRef.current) {
      const edgeToRestore = tempRemovedEdgeRef.current;
      tempRemovedEdgeRef.current = null;
      setEdges((eds) => {
        if (eds.some((e) => e.id === edgeToRestore.id)) return eds;
        return [...eds, edgeToRestore];
      });
    }
  }, [setEdges]);

  const setContextMenu = useCallback(
    (val: typeof contextMenuState) => {
      setContextMenuState(val);
      if (val === null) {
        restoreTempRemovedEdge();
      }
    },
    [restoreTempRemovedEdge]
  );

  const onPaneClick = useCallback(() => {
    if (justEndedDragRef.current) return;
    setSelectedNodeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setContextMenu]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) return;
      takeSnapshot();
      didConnectRef.current = true;
      let sourceHandle = params.sourceHandle;
      if (!sourceHandle) {
        const sourceNode = nodes.find((n) => n.id === params.source);
        sourceHandle = sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next';
      }
      tempRemovedEdgeRef.current = null;
      setEdges((eds) => {
        const filtered = eds.filter((e) => !(e.source === params.source && e.sourceHandle === sourceHandle));
        return addEdge({ ...params, sourceHandle, ...FLOW_EDGE_DEFAULTS, type: edgeType }, filtered);
      });
    },
    [setEdges, nodes, edgeType, takeSnapshot]
  );

  const onConnectStart = useCallback(
    (_event: unknown, { nodeId, handleId, handleType }: { nodeId: string | null; handleId: string | null; handleType: 'source' | 'target' | null }) => {
      if (!nodeId || !handleType) return;
      connectionStartRef.current = { nodeId, handleId, handleType };
      didConnectRef.current = false;

      if (tempRemovedEdgeRef.current) {
        restoreTempRemovedEdge();
      }

      if (handleType === 'source') {
        let sourceHandle = handleId;
        if (!sourceHandle) {
          const sourceNode = nodes.find((n) => n.id === nodeId);
          sourceHandle = sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next';
        }
        const existingEdge = edges.find((e) => e.source === nodeId && e.sourceHandle === sourceHandle);
        if (existingEdge) {
          tempRemovedEdgeRef.current = existingEdge;
          setEdges((eds) => eds.filter((e) => e.id !== existingEdge.id));
        }
      }
    },
    [nodes, edges, setEdges, restoreTempRemovedEdge]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const connectionStart = connectionStartRef.current;
      if (!connectionStart) return;

      if (didConnectRef.current) {
        connectionStartRef.current = null;
        return;
      }

      let clientX: number;
      let clientY: number;
      if ('clientX' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if ('touches' in event && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if ('changedTouches' in event && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else {
        return;
      }

      const elementsUnderPoint =
        typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(clientX, clientY) : [];

      let nodeElement: Element | null = null;
      let isHandle = false;

      for (const el of elementsUnderPoint) {
        if (el.classList.contains('react-flow__handle') || el.closest('.react-flow__handle')) {
          isHandle = true;
        }
        const closestNode = el.closest('.react-flow__node');
        if (closestNode) {
          nodeElement = closestNode;
          break;
        }
      }

      if (nodeElement) {
        const targetNodeId = nodeElement.getAttribute('data-id');
        const targetNode = nodes.find((n) => n.id === targetNodeId);
        if (targetNodeId && targetNodeId !== connectionStart.nodeId && targetNode?.type !== 'START_BROADCAST') {
          let sourceHandle = connectionStart.handleId;
          if (!sourceHandle) {
            const sourceNode = nodes.find((n) => n.id === connectionStart.nodeId);
            sourceHandle = sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next';
          }
          const params: Connection = {
            source: connectionStart.nodeId,
            sourceHandle: sourceHandle,
            target: targetNodeId,
            targetHandle: null,
          };
          takeSnapshot();
          tempRemovedEdgeRef.current = null;
          setEdges((eds) => {
            const filtered = eds.filter((e) => !(e.source === params.source && e.sourceHandle === sourceHandle));
            return addEdge({ ...params, ...FLOW_EDGE_DEFAULTS, type: edgeType }, filtered);
          });
        } else {
          restoreTempRemovedEdge();
        }
        connectionStartRef.current = null;
        return;
      }

      if (!isHandle) {
        const targetScreenX = Math.min(clientX, window.innerWidth - 240) - 8;
        const targetScreenY = Math.min(clientY, window.innerHeight - 360) + 150;

        const position = screenToFlowPosition({
          x: targetScreenX,
          y: targetScreenY,
        });

        justEndedDragRef.current = true;
        setTimeout(() => {
          justEndedDragRef.current = false;
        }, 100);

        setContextMenu({
          isOpen: true,
          x: clientX,
          y: clientY,
          flowPosition: position,
          source: connectionStart,
        });
      } else {
        restoreTempRemovedEdge();
      }

      connectionStartRef.current = null;
    },
    [screenToFlowPosition, setEdges, nodes, edgeType, takeSnapshot, setContextMenu, restoreTempRemovedEdge]
  );

  const handleCreateAndConnectNode = useCallback(
    (type: string) => {
      if (!contextMenuState) return;
      const { flowPosition, source } = contextMenuState;

      takeSnapshot();
      const id = `node_${type.toLowerCase()}_${Date.now()}`;
      const newNode: CustomNode = {
        id,
        type,
        position: flowPosition,
        data: getDefaultNodeData(type),
        selected: true,
      };

      let sourceHandle = source.handleId;
      if (!sourceHandle) {
        const srcNode = nodes.find((n) => n.id === source.nodeId);
        sourceHandle = srcNode?.type === 'START_BROADCAST' ? 'then' : 'next';
      }

      const newEdge: Edge = {
        ...FLOW_EDGE_DEFAULTS,
        id: `edge_${source.nodeId}_${id}`,
        source: source.nodeId,
        sourceHandle: sourceHandle,
        target: id,
        type: edgeType,
      };

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false }) as CustomNode), newNode]);

      setEdges((eds) => {
        const filtered = eds.filter((e) => !(e.source === source.nodeId && e.sourceHandle === sourceHandle));
        return [...filtered, newEdge];
      });

      setSelectedNodeId(id);
      setContextMenu(null);
    },
    [contextMenuState, takeSnapshot, getDefaultNodeData, nodes, edgeType, setNodes, setEdges, setSelectedNodeId, setContextMenu]
  );

  return {
    onConnect,
    onConnectStart,
    onConnectEnd,
    onPaneClick,
    contextMenu: contextMenuState,
    setContextMenu,
    handleCreateAndConnectNode,
    edgeType,
    setEdgeType,
    hoveredEdgeId,
  };
};
