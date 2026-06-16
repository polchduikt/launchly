import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {useNodesState, useEdgesState, addEdge, useReactFlow,} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import { useBotStore } from '../../../store/useBotStore';
import { useFlowSchemaQuery, useSaveFlowSchemaMutation } from './useFlowSchema';
import { FLOW_EDGE_DEFAULTS } from '../config/flowEdges';
import { createDefaultNodeData } from '../config/flowBlocks';
import { getAutoLayoutedElements } from '../utils/flowLayout';
import { ROUTES } from '../../../constants/routes';

export const useFlowBuilder = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [edgeType, setEdgeType] = useState<'default' | 'smoothstep'>(
    () => (localStorage.getItem('launchly_flow_edge_type') as 'default' | 'smoothstep') || 'default');
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const connectionStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string } | null>(null);
  const didConnectRef = useRef<boolean>(false);
  const justEndedDragRef = useRef<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    source: { nodeId: string; handleId: string | null; handleType: string };
  } | null>(null);

  const triggerSaveError = (msg: string) => {
    setSaveError(msg);
    if (saveErrorTimeoutRef.current) {
      clearTimeout(saveErrorTimeoutRef.current);
    }
    saveErrorTimeoutRef.current = setTimeout(() => {
      setSaveError(null);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (saveErrorTimeoutRef.current) {
        clearTimeout(saveErrorTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeBotId) {
      navigate(ROUTES.HOME);
    }
  }, [activeBotId, navigate]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  useEffect(() => {
    localStorage.setItem('launchly_flow_edge_type', edgeType);
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        type: edgeType,
      }))
    );
  }, [edgeType, setEdges]);

  const { data: schema, isLoading: isLoadingSchema } = useFlowSchemaQuery(activeBotId || 0);
  const saveMutation = useSaveFlowSchemaMutation(activeBotId || 0);

  useEffect(() => {
    if (!isLoadingSchema) {
      if (schema) {
        let parsedNodes: Node[] = [];
        let parsedEdges: Edge[] = [];

        try {
          const rawNodes = typeof schema.nodes === 'string' ? JSON.parse(schema.nodes) : schema.nodes;
          const rawEdges = typeof schema.edges === 'string' ? JSON.parse(schema.edges) : schema.edges;
          if (Array.isArray(rawNodes)) {
            parsedNodes = rawNodes;
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
        } catch (e) {
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
      } else {
        setNodes([
          {
            id: 'node_start',
            type: 'START',
            position: { x: 100, y: 150 },
            data: {},
          },
        ]);
        setEdges([]);
      }
    }
  }, [schema, isLoadingSchema, setNodes, setEdges]);

  useEffect(() => {
    const handleEditButton = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.isRedispatched) {
        return;
      }
      
      const { nodeId, button } = customEvent.detail;
      setSelectedNodeId(nodeId);
      
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('edit-flow-button', {
            detail: { nodeId, button, isRedispatched: true },
          })
        );
      }, 50);
    };

    window.addEventListener('edit-flow-button', handleEditButton);
    return () => {
      window.removeEventListener('edit-flow-button', handleEditButton);
    };
  }, []);

  const onConnect = useCallback(
    (params: Connection) => {
      didConnectRef.current = true;
      let sourceHandle = params.sourceHandle;
      if (!sourceHandle) {
        const sourceNode = nodes.find((n) => n.id === params.source);
        sourceHandle = sourceNode?.type === 'START' ? 'then' : 'next';
      }
      setEdges((eds) => addEdge({ ...params, sourceHandle, ...FLOW_EDGE_DEFAULTS, type: edgeType }, eds));
    },
    [setEdges, nodes, edgeType]
  );

  const onConnectStart = useCallback((_event: unknown, { nodeId, handleId, handleType }: { nodeId: string | null; handleId: string | null; handleType: 'source' | 'target' | null }) => {
    if (!nodeId || !handleType) return;
    connectionStartRef.current = { nodeId, handleId, handleType };
    didConnectRef.current = false;
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const connectionStart = connectionStartRef.current;
      if (!connectionStart) return;

      if (didConnectRef.current) {
        connectionStartRef.current = null;
        return;
      }

      let clientX = 0;
      let clientY = 0;
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

      const actualTarget = document.elementFromPoint(clientX, clientY);

      const nodeElement = actualTarget && typeof actualTarget.closest === 'function'
        ? actualTarget.closest('.react-flow__node')
        : null;

      if (nodeElement) {
        const targetNodeId = nodeElement.getAttribute('data-id');
        if (targetNodeId && targetNodeId !== connectionStart.nodeId) {
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
          setEdges((eds) => addEdge({ ...params, ...FLOW_EDGE_DEFAULTS, type: edgeType }, eds));
          connectionStartRef.current = null;
          return;
        }
      }

      const isHandle = actualTarget && typeof actualTarget.closest === 'function'
        ? actualTarget.classList.contains('react-flow__handle') || actualTarget.closest('.react-flow__handle')
        : false;

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
      }

      connectionStartRef.current = null;
    },
    [screenToFlowPosition, setEdges, nodes, edgeType]
  );

  const handleCreateAndConnectNode = (type: string) => {
    if (!contextMenu) return;
    const { flowPosition, source } = contextMenu;

    if (type === 'START') {
      const hasStart = nodes.some((n) => n.type === 'START');
      if (hasStart) {
        triggerSaveError('Flow must have exactly one START node');
        setContextMenu(null);
        return;
      }
    }

    const newNodeId = `node_${type.toLowerCase()}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type,
      position: flowPosition,
      data: createDefaultNodeData(type),
    };

    let sourceHandle = source.handleType === 'source' ? source.handleId : null;
    if (source.handleType === 'target') {
      sourceHandle = type === 'START' ? 'then' : 'next';
    } else if (!sourceHandle) {
      const srcNode = nodes.find((n) => n.id === source.nodeId);
      sourceHandle = srcNode?.type === 'START' ? 'then' : 'next';
    }

    const newEdge: Edge = {
      ...FLOW_EDGE_DEFAULTS,
      id: `edge_${Date.now()}`,
      source: source.handleType === 'source' ? source.nodeId : newNodeId,
      sourceHandle,
      target: source.handleType === 'target' ? source.nodeId : newNodeId,
      targetHandle: source.handleType === 'target' ? source.handleId : null,
      type: edgeType,
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => addEdge(newEdge, eds));
    setSelectedNodeId(newNodeId);
    setContextMenu(null);
  };

  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: newData };
          }
          return node;
          })
      );
    },
    [setNodes]
  );

  const handleAddNode = (type: string) => {
    if (type === 'START') {
      const hasStart = nodes.some((n) => n.type === 'START');
      if (hasStart) {
        triggerSaveError('Flow must have exactly one START node');
        return;
      }
    }

    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const newNode: Node = {
      id,
      type,
      position: { x: Math.random() * 200 + 150, y: Math.random() * 200 + 100 },
      data: createDefaultNodeData(type),
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
    if (nodeToDelete?.type === 'START') {
      triggerSaveError('You cannot delete the START node');
      return;
    }

    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleAutoLayout = (direction: 'LR' | 'TB') => {
    const layouted = getAutoLayoutedElements(nodes, edges, direction);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  };

  const handleSaveFlow = () => {
    setSaveError(null);

    const startCount = nodes.filter((n) => n.type === 'START').length;
    if (startCount !== 1) {
      setSaveError('Flow must have exactly one START node');
      return;
    }

    saveMutation.mutate({
      nodes,
      edges,
    });
  };

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

  const justEndedDrag = justEndedDragRef.current;

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    displayNodes,
    displayEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    selectedNodeId,
    setSelectedNodeId,
    edgeType,
    setEdgeType,
    saveError,
    setSaveError,
    isAiModalOpen,
    setIsAiModalOpen,
    isAddDropdownOpen,
    setIsAddDropdownOpen,
    contextMenu,
    setContextMenu,
    handleCreateAndConnectNode,
    handleUpdateNodeData,
    handleAddNode,
    handleDeleteSelectedNode,
    handleAutoLayout,
    handleSaveFlow,
    selectedNode,
    saveMutation,
    isLoadingSchema,
    justEndedDrag,
  };
};
