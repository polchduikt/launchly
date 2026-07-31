import { useState, useCallback, useRef, useEffect } from 'react';
import type { Node, Edge } from '@xyflow/react';

const getFastFlowSignature = (nodes: Node[], edges: Edge[]): string => {
  return `${nodes.length}:${edges.length}:${nodes.map(n => n.id + ':' + n.type).join('|')}:${edges.map(e => e.id).join('|')}`;
};

export const useFlowHistory = (
  nodes: Node[],
  edges: Edge[],
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [past, setPast] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const takeSnapshot = useCallback(() => {
    setPast((p) => {
      if (p.length > 0) {
        const last = p[p.length - 1];
        if (getFastFlowSignature(last.nodes, last.edges) === getFastFlowSignature(nodes, edges)) {
          return p;
        }
      }
      return [...p, { nodes, edges }];
    });
    setFuture([]);
  }, [nodes, edges]);

  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const takeSnapshotBeforeEdit = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      takeSnapshot();
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 800);
  }, [takeSnapshot]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((f) => [...f, { nodes, edges }]);

    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNodeId(null);
  }, [past, nodes, edges, setNodes, setEdges, setSelectedNodeId]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const newFuture = future.slice(0, future.length - 1);

    setFuture(newFuture);
    setPast((p) => [...p, { nodes, edges }]);

    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
  }, [future, nodes, edges, setNodes, setEdges, setSelectedNodeId]);

  return {
    past,
    future,
    setPast,
    setFuture,
    undo,
    redo,
    takeSnapshot,
    takeSnapshotBeforeEdit,
  };
};
