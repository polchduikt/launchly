import { useState, useEffect, useRef, type MutableRefObject, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { getFlowKey } from '../../utils/flowHelpers';
import { FLOW_DEFAULTS } from '../../const/constants';

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
  const saveMutateRef = useRef(saveMutation.mutate);
  saveMutateRef.current = saveMutation.mutate;
  
  const getDebounceDelay = useCallback(() => {
    const totalElements = nodes.length + edges.length;
    if (totalElements > FLOW_DEFAULTS.AUTO_SAVE_HEAVY_ELEMENTS) return FLOW_DEFAULTS.AUTO_SAVE_HEAVY_DELAY_MS;
    if (totalElements > FLOW_DEFAULTS.AUTO_SAVE_MEDIUM_ELEMENTS) return FLOW_DEFAULTS.AUTO_SAVE_MEDIUM_DELAY_MS;
    return FLOW_DEFAULTS.AUTO_SAVE_LIGHT_DELAY_MS;
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

    const startCount = nodes.filter((n) => n.type === 'START').length;
    if (startCount !== 1) {
      return;
    }

    const timer = setTimeout(() => {
      saveMutateRef.current({ nodes, edges });
      lastSavedKeyRef.current = currentKey;
      setIsDirty(false);
      if (isLocalChangeRef) {
        isLocalChangeRef.current = false;
      }
    }, getDebounceDelay());

    return () => clearTimeout(timer);
  }, [nodes, edges, isLoadingSchema, isLocalChangeRef, getDebounceDelay]);

  return {
    isDirty,
    setIsDirty,
    lastSavedKeyRef,
    isInitialLoadDoneRef,
  };
};

