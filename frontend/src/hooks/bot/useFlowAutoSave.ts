import {useState, useEffect, useRef, type MutableRefObject, useCallback} from 'react';
import type { Node, Edge } from '@xyflow/react';
import { getFlowKey } from '../../utils/flowHelpers';

export const useFlowAutoSave = (
  activeBotId: number | null,
  nodes: Node[],
  edges: Edge[],
  isLoadingSchema: boolean,
  saveMutation: { mutate: (variables: { nodes: Node[]; edges: Edge[] }) => void },
  isLocalChangeRef?: MutableRefObject<boolean>
) => {
  const lastSavedKeyRef = useRef<string>('');
  const isInitialLoadDoneRef = useRef<boolean>(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const getDebounceDelay = useCallback(() => {
    const totalElements = nodes.length + edges.length;
    if (totalElements > 100) return 3000;
    if (totalElements > 50) return 2000;
    return 1500;
  }, [nodes.length, edges.length]);

  useEffect(() => {
    isInitialLoadDoneRef.current = false;
  }, [activeBotId]);

  useEffect(() => {
    if (!isLoadingSchema && nodes.length > 0) {
      if (!isInitialLoadDoneRef.current) {
        isInitialLoadDoneRef.current = true;
        lastSavedKeyRef.current = getFlowKey(nodes, edges);
        if (isLocalChangeRef) {
          isLocalChangeRef.current = false;
        }
      }
    }
  }, [isLoadingSchema, nodes, edges, isLocalChangeRef]);

  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;

    const currentKey = getFlowKey(nodes, edges);
    if (currentKey === lastSavedKeyRef.current) {
      setIsDirty(false);
      return;
    }

    if (isLocalChangeRef && !isLocalChangeRef.current) {
      return;
    }

    setIsDirty(true);
  }, [nodes, edges, isLocalChangeRef]);

  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;

    const currentKey = getFlowKey(nodes, edges);
    if (currentKey === lastSavedKeyRef.current) {
      setIsDirty(false);
      return;
    }

    if (isLocalChangeRef && !isLocalChangeRef.current) {
      return;
    }

    const startCount = nodes.filter((n) => n.type === 'START').length;
    if (startCount !== 1) {
      return;
    }

    const timer = setTimeout(() => {
      saveMutation.mutate({ nodes, edges });
      lastSavedKeyRef.current = currentKey;
      setIsDirty(false);
      if (isLocalChangeRef) {
        isLocalChangeRef.current = false;
      }
    }, getDebounceDelay());

    return () => clearTimeout(timer);
  }, [nodes, edges, saveMutation, isLoadingSchema, isLocalChangeRef, getDebounceDelay]);

  return {
    isDirty,
    setIsDirty,
    lastSavedKeyRef,
    isInitialLoadDoneRef,
  };
};

