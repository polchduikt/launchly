import { useState, useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { getFlowKey } from '../utils/flowHelpers';

export const useFlowAutoSave = (
  activeBotId: number | null,
  nodes: Node[],
  edges: Edge[],
  isLoadingSchema: boolean,
  saveMutation: { mutate: (variables: { nodes: Node[]; edges: Edge[] }) => void }
) => {
  const lastSavedKeyRef = useRef<string>('');
  const isInitialLoadDoneRef = useRef<boolean>(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    isInitialLoadDoneRef.current = false;
  }, [activeBotId]);

  useEffect(() => {
    if (!isLoadingSchema && nodes.length > 0) {
      if (!isInitialLoadDoneRef.current) {
        isInitialLoadDoneRef.current = true;
        lastSavedKeyRef.current = getFlowKey(nodes, edges);
      }
    }
  }, [isLoadingSchema, nodes, edges]);

  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;
    const currentKey = getFlowKey(nodes, edges);
    setIsDirty(currentKey !== lastSavedKeyRef.current);
  }, [nodes, edges]);

  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;

    const currentKey = getFlowKey(nodes, edges);
    if (currentKey === lastSavedKeyRef.current) return;

    const startCount = nodes.filter((n) => n.type === 'START').length;
    if (startCount !== 1) {
      return;
    }

    const timer = setTimeout(() => {
      saveMutation.mutate({ nodes, edges });
      lastSavedKeyRef.current = currentKey;
      setIsDirty(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [nodes, edges, saveMutation, isLoadingSchema]);

  return {
    isDirty,
    setIsDirty,
    lastSavedKeyRef,
    isInitialLoadDoneRef,
  };
};
