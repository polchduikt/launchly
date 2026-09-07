import { useState, useCallback } from 'react';

export interface FlowContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  flowPosition: { x: number; y: number };
  source: { nodeId: string; handleId: string | null; handleType: string };
}

interface UseFlowContextMenuParams {
  onClose?: () => void;
}

export const useFlowContextMenu = ({ onClose }: UseFlowContextMenuParams = {}) => {
  const [contextMenu, setContextMenuState] = useState<FlowContextMenuState | null>(null);

  const setContextMenu = useCallback(
    (val: FlowContextMenuState | null) => {
      setContextMenuState(val);
      if (val === null && onClose) {
        onClose();
      }
    },
    [onClose]
  );

  return {
    contextMenu,
    setContextMenu,
  };
};
