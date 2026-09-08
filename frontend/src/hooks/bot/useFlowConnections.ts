import { useEffect, useCallback, useRef } from 'react';
import { addEdge } from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import { FLOW_EDGE_DEFAULTS } from '../../const/flowEdges';
import type { FlowContextMenuState } from './useFlowContextMenu';
import { useFlowUiStore } from '../../store/useFlowUiStore';

interface UseFlowConnectionsParams {
  nodes: Node[];
  edges: Edge[];
  setEdges: (update: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  edgeType: 'default' | 'smoothstep';
  takeSnapshot: () => void;
  screenToFlowPosition: (clientPos: { x: number; y: number }) => { x: number; y: number };
  setContextMenu: (menu: FlowContextMenuState | null) => void;
}

export const useFlowConnections = ({
  nodes,
  edges,
  setEdges,
  edgeType,
  takeSnapshot,
  screenToFlowPosition,
  setContextMenu,
}: UseFlowConnectionsParams) => {
  const hoveredEdgeId = useFlowUiStore((s) => s.hoveredEdgeId);
  const setHoveredEdgeId = useFlowUiStore((s) => s.setHoveredEdgeId);
  const connectionStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string } | null>(null);
  const didConnectRef = useRef<boolean>(false);
  const justEndedDragRef = useRef<boolean>(false);
  const tempRemovedEdgeRef = useRef<Edge | null>(null);

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
  }, [setHoveredEdgeId]);

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

  const isValidConnection = useCallback(
    (connection: Connection | { source: string; target: string; sourceHandle?: string | null }) => {
      if (connection.source === connection.target) return false;
      const targetNode = nodes.find((n) => n.id === connection.target);
      if (targetNode?.type === 'START') return false;

      if (connection.sourceHandle === 'reply') {
        return targetNode?.type === 'ACTION';
      }
      if (connection.sourceHandle === 'timeout') {
        return targetNode?.type !== 'ACTION';
      }

      return true;
    },
    [nodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) return;
      takeSnapshot();
      didConnectRef.current = true;
      let sourceHandle = params.sourceHandle;
      if (!sourceHandle) {
        const sourceNode = nodes.find((n) => n.id === params.source);
        sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
      }
      tempRemovedEdgeRef.current = null;
      setEdges((eds) => {
        const filtered = eds.filter((e) => !(e.source === params.source && e.sourceHandle === sourceHandle));
        return addEdge({ ...params, sourceHandle, ...FLOW_EDGE_DEFAULTS, type: edgeType }, filtered);
      });
    },
    [setEdges, nodes, edgeType, takeSnapshot, isValidConnection]
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
          sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
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
        if (targetNodeId && targetNodeId !== connectionStart.nodeId && targetNode?.type !== 'START') {
          let sourceHandle = connectionStart.handleId;
          if (!sourceHandle) {
            const sourceNode = nodes.find((n) => n.id === connectionStart.nodeId);
            sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
          }
          const params: Connection = {
            source: connectionStart.nodeId,
            sourceHandle: sourceHandle,
            target: targetNodeId,
            targetHandle: null,
          };
          if (!isValidConnection(params)) {
            restoreTempRemovedEdge();
            connectionStartRef.current = null;
            return;
          }
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
    [screenToFlowPosition, setEdges, nodes, edgeType, takeSnapshot, setContextMenu, restoreTempRemovedEdge, isValidConnection]
  );

  return {
    hoveredEdgeId,
    isValidConnection,
    onConnect,
    onConnectStart,
    onConnectEnd,
    restoreTempRemovedEdge,
    tempRemovedEdgeRef,
    justEndedDragRef,
  };
};
