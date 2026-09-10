import { useState, useEffect, useCallback, useRef, useMemo, type MutableRefObject } from 'react';
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import { FLOW_EDGE_DEFAULTS } from '../../const/flowEdges';
import { getNodesAfterRemovingEdges } from '../../utils/flowHelpers';
import type { FlowContextMenuState } from './useFlowContextMenu';

interface UseFlowStateParams {
  activeBotId?: number | null;
  schema?: { nodes?: unknown; edges?: unknown };
  isLoadingSchema: boolean;
  takeSnapshot: () => void;
  fitView: (opts?: Record<string, unknown>) => void;
  contextMenu: FlowContextMenuState | null;
  isLocalChangeRef?: MutableRefObject<boolean>;
}

export const useFlowState = ({
  activeBotId,
  schema,
  isLoadingSchema,
  takeSnapshot,
  fitView,
  contextMenu,
  isLocalChangeRef,
}: UseFlowStateParams) => {
  const [nodes, setNodesRaw, onNodesChangeState] = useNodesState<Node>([]);
  const [edges, setEdgesRaw, onEdgesChangeState] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [edgeType, setEdgeType] = useState<'default' | 'smoothstep'>(
    () => (localStorage.getItem('launchly_flow_edge_type') as 'default' | 'smoothstep') || 'default'
  );

  const isBatchOperationRef = useRef<boolean>(false);

  const startBatch = useCallback(() => {
    isBatchOperationRef.current = true;
  }, []);

  const endBatch = useCallback(() => {
    isBatchOperationRef.current = false;
  }, []);

  const setNodes = useCallback(
    (update: Node[] | ((nds: Node[]) => Node[])) => {
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      setNodesRaw(update);
    },
    [setNodesRaw, isLocalChangeRef]
  );

  const setEdges = useCallback(
    (update: Edge[] | ((eds: Edge[]) => Edge[])) => {
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      setEdgesRaw(update);
    },
    [setEdgesRaw, isLocalChangeRef]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[]; edges: Edge[] }) => {
      if (selectedNodes.length === 0) {
        setSelectedNodeId(null);
      } else {
        const isCurrentSelected = selectedNodes.some((n) => n.id === selectedNodeId);
        if (!isCurrentSelected) {
          setSelectedNodeId(selectedNodes[selectedNodes.length - 1].id);
        }
      }
    },
    [selectedNodeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (isLocalChangeRef) {
        const hasRelevantChange = changes.some(
          (c) => c.type !== 'select' && c.type !== 'dimensions'
        );
        if (hasRelevantChange) {
          isLocalChangeRef.current = true;
        }
      }
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        takeSnapshot();
      }
      onNodesChangeState(changes);
    },
    [onNodesChangeState, takeSnapshot, isLocalChangeRef]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        takeSnapshot();
        const removedEdgeIds = changes
          .filter((c) => c.type === 'remove')
          .map((c) => (c as { id: string }).id);
        const removedEdges = edges.filter((e) => removedEdgeIds.includes(e.id));
        const nextNodes = getNodesAfterRemovingEdges(nodes, removedEdges);
        setNodes(nextNodes);
      }
      onEdgesChangeState(changes);
    },
    [edges, nodes, setNodes, onEdgesChangeState, takeSnapshot, isLocalChangeRef]
  );

  useEffect(() => {
    localStorage.setItem('launchly_flow_edge_type', edgeType);
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        type: edgeType,
      }))
    );
  }, [edgeType, setEdges]);

  const isSchemaLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    isSchemaLoadedRef.current = false;
  }, [activeBotId]);

  useEffect(() => {
    if (!isLoadingSchema && !isSchemaLoadedRef.current) {
      if (schema) {
        isSchemaLoadedRef.current = true;
        let parsedNodes: Node[] = [];
        let parsedEdges: Edge[] = [];

        try {
          const rawNodes = typeof schema.nodes === 'string' ? JSON.parse(schema.nodes) : schema.nodes;
          const rawEdges = typeof schema.edges === 'string' ? JSON.parse(schema.edges) : schema.edges;
          if (Array.isArray(rawNodes)) {
            parsedNodes = rawNodes.map((node) => ({ ...node, selected: false }));
          }
          if (Array.isArray(rawEdges)) {
            parsedEdges = rawEdges.map((edge) => {
              let sourceHandle = edge.sourceHandle;
              if (!sourceHandle) {
                const sourceNode = parsedNodes.find((n) => n.id === edge.source);
                sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
              }
              return {
                ...FLOW_EDGE_DEFAULTS,
                ...edge,
                type: edgeType,
                sourceHandle,
                markerEnd: FLOW_EDGE_DEFAULTS.markerEnd,
                style: FLOW_EDGE_DEFAULTS.style,
              };
            });
          }
        } catch {
          parsedNodes = [];
          parsedEdges = [];
        }

        if (parsedNodes.length === 0) {
          parsedNodes = [
            {
              id: 'node_start',
              type: 'START',
              position: { x: 100, y: 150 },
              data: {},
            },
          ];
          parsedEdges = [];
        }

        setNodes(parsedNodes);
        setEdges(parsedEdges);

        setTimeout(() => {
          fitView({ maxZoom: 1, padding: 0.2 });
        }, 50);
      } else {
        isSchemaLoadedRef.current = true;
        setNodes([
          {
            id: 'node_start',
            type: 'START',
            position: { x: 100, y: 150 },
            data: {},
          },
        ]);
        setEdges([]);

        setTimeout(() => {
          fitView({ maxZoom: 1, padding: 0.2 });
        }, 50);
      }
    }
  }, [schema, isLoadingSchema, setNodes, setEdges, fitView, edgeType]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const displayNodes = useMemo(() => {
    const tempNode: Node = {
      id: 'temp_menu_node',
      type: 'TEMP',
      position: contextMenu ? contextMenu.flowPosition : (nodes[0]?.position || { x: 0, y: 0 }),
      data: {},
      selectable: false,
      draggable: false,
      hidden: !contextMenu,
    };

    if (contextMenu) {
      const { source } = contextMenu;
      const mappedNodes = nodes.map((node) => {
        if (node.id === source.nodeId) {
          let sourceHandle = source.handleType === 'source' ? source.handleId : null;
          if (!sourceHandle) {
            sourceHandle = node.type === 'START' ? 'then' : 'next';
          }
          return {
            ...node,
            data: {
              ...node.data,
              _hasTempConnection: true,
              _tempSourceHandle: sourceHandle,
            },
          };
        }
        return node;
      });
      return [...mappedNodes, tempNode];
    }
    return [...nodes, tempNode];
  }, [nodes, contextMenu]);

  const displayEdges = useMemo(() => {
    if (contextMenu) {
      const { source } = contextMenu;
      let sourceHandle = source.handleType === 'source' ? source.handleId : null;
      if (!sourceHandle) {
        const srcNode = nodes.find((n) => n.id === source.nodeId);
        sourceHandle = srcNode?.type === 'START' ? 'then' : 'next';
      }
      const tempEdge: Edge = {
        ...FLOW_EDGE_DEFAULTS,
        id: 'temp_menu_edge',
        source: source.nodeId,
        sourceHandle,
        target: 'temp_menu_node',
        targetHandle: 'temp_target',
        type: edgeType,
        selectable: false,
      };
      return [...edges, tempEdge];
    }
    return edges;
  }, [edges, contextMenu, edgeType, nodes]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    setNodesRaw,
    setEdgesRaw,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    edgeType,
    setEdgeType,
    startBatch,
    endBatch,
    onSelectionChange,
    onNodesChange,
    onEdgesChange,
    displayNodes,
    displayEdges,
  };
};
