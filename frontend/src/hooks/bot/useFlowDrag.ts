import { useCallback, useRef, type MutableRefObject } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { getFlowKey } from '../../utils/flowHelpers';

interface UseFlowDragParams {
  nodes: Node[];
  edges: Edge[];
  setPast: React.Dispatch<React.SetStateAction<{ nodes: Node[]; edges: Edge[] }[]>>;
  setFuture: React.Dispatch<React.SetStateAction<{ nodes: Node[]; edges: Edge[] }[]>>;
  setIsDirty: (dirty: boolean) => void;
  isLocalChangeRef?: MutableRefObject<boolean>;
}

export const useFlowDrag = ({
  nodes,
  edges,
  setPast,
  setFuture,
  setIsDirty,
  isLocalChangeRef,
}: UseFlowDragParams) => {
  const dragStartStateRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const onNodeDragStart = useCallback(() => {
    dragStartStateRef.current = { nodes, edges };
  }, [nodes, edges]);

  const onNodeDragStop = useCallback(() => {
    if (isLocalChangeRef) {
      isLocalChangeRef.current = true;
    }
    setIsDirty(true);
    if (!dragStartStateRef.current) return;
    const startKey = getFlowKey(dragStartStateRef.current.nodes, dragStartStateRef.current.edges);
    const currentKey = getFlowKey(nodes, edges);
    if (startKey !== currentKey) {
      const startState = dragStartStateRef.current;
      setPast((p) => {
        if (p.length > 0) {
          const last = p[p.length - 1];
          if (getFlowKey(last.nodes, last.edges) === startKey) {
            return p;
          }
        }
        return [...p, startState];
      });
      setFuture([]);
    }
    dragStartStateRef.current = null;
  }, [nodes, edges, setPast, setFuture, isLocalChangeRef, setIsDirty]);

  return {
    onNodeDragStart,
    onNodeDragStop,
  };
};
