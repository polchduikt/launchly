import { useMemo, useCallback } from 'react';
import { useNodeConnections, useConnection } from '@xyflow/react';

export function useNodePerformance(nodeId: string) {
  const sourceConnections = useNodeConnections({ handleType: 'source' });
  const targetConnections = useNodeConnections({ handleType: 'target' });
  const isSourceHandleConnected = useCallback(
    (handleId: string) => {
      return sourceConnections.some((c) => c.sourceHandle === handleId);
    },
    [sourceConnections]
  );

  const isTargetConnected = useMemo(
    () => targetConnections.some((c) => c.source !== 'temp_menu_node'),
    [targetConnections]
  );
  const connection = useConnection();
  const isConnecting = connection.inProgress;
  const isGrayedOut = useMemo(() => {
    if (!isConnecting) return false;
    if (connection.fromNode?.id === nodeId) return true;
    const sourceHandleId = connection.fromHandle?.id;
    if (sourceHandleId === 'reply') return true;
    return false;
  }, [isConnecting, connection, nodeId]);

  return {
    sourceConnections,
    targetConnections,
    isSourceHandleConnected,
    isTargetConnected,
    isGrayedOut,
    connection,
    isConnecting,
  };
}

export function useNodePerformanceAction(nodeId: string) {
  const sourceConnections = useNodeConnections({ handleType: 'source' });
  const targetConnections = useNodeConnections({ handleType: 'target' });

  const isSourceHandleConnected = useCallback(
    (handleId: string) => {
      return sourceConnections.some((c) => c.sourceHandle === handleId);
    },
    [sourceConnections]
  );

  const isTargetConnected = useMemo(
    () => targetConnections.some((c) => c.source !== 'temp_menu_node'),
    [targetConnections]
  );

  const connection = useConnection();
  const isConnecting = connection.inProgress;

  const isGrayedOut = useMemo(() => {
    if (!isConnecting) return false;
    if (connection.fromNode?.id === nodeId) return true;
    const sourceHandleId = connection.fromHandle?.id;
    if (sourceHandleId === 'reply') return false;
    if (sourceHandleId === 'timeout') return true;
    return false;
  }, [isConnecting, connection, nodeId]);

  return {
    sourceConnections,
    targetConnections,
    isSourceHandleConnected,
    isTargetConnected,
    isGrayedOut,
    connection,
    isConnecting,
  };
}
