import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNodesState, useEdgesState, addEdge, useReactFlow } from '@xyflow/react';
import type { Connection, Edge, Node, NodeChange, EdgeChange } from '@xyflow/react';
import { useBotStore } from '../../../store/useBotStore';
import { useFlowSchemaQuery, useSaveFlowSchemaMutation } from './useFlowSchema';
import { FLOW_EDGE_DEFAULTS } from '../config/flowEdges';
import { createDefaultNodeData } from '../config/flowBlocks';
import { getAutoLayoutedElements } from '../utils/flowLayout';
import { ROUTES } from '../../../constants/routes';
import type { ButtonData, FlowBlock } from '../../../types/bot';
import { getFlowKey, getNodesAfterRemovingEdges } from '../utils/flowHelpers';
import { useFlowHistory } from './useFlowHistory';
import { useFlowAutoSave } from './useFlowAutoSave';
import { getBlocks } from './useNodeEditor';
export const useFlowBuilder = () => {
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChangeState] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChangeState] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

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
  }, []);

  const {
    past,
    future,
    setPast,
    setFuture,
    undo,
    redo,
    takeSnapshot,
    takeSnapshotBeforeEdit,
  } = useFlowHistory(nodes, edges, setNodes, setEdges, setSelectedNodeId);

  const { data: schema, isLoading: isLoadingSchema } = useFlowSchemaQuery(activeBotId || 0);
  const saveMutation = useSaveFlowSchemaMutation(activeBotId || 0);

  const {
    isDirty,
    setIsDirty,
    lastSavedKeyRef,
  } = useFlowAutoSave(activeBotId, nodes, edges, isLoadingSchema, saveMutation);

  const [edgeType, setEdgeType] = useState<'default' | 'smoothstep'>(
    () => (localStorage.getItem('launchly_flow_edge_type') as 'default' | 'smoothstep') || 'default');
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const connectionStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string } | null>(null);
  const didConnectRef = useRef<boolean>(false);
  const justEndedDragRef = useRef<boolean>(false);
  const tempRemovedEdgeRef = useRef<Edge | null>(null);

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

  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    source: { nodeId: string; handleId: string | null; handleType: string };
  } | null>(null);

  const setContextMenu = useCallback((val: typeof contextMenuState) => {
    setContextMenuState(val);
    if (val === null) {
      restoreTempRemovedEdge();
    }
  }, [restoreTempRemovedEdge]);

  const contextMenu = contextMenuState;

  const dragStartStateRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);

  const onNodeDragStart = useCallback(() => {
    dragStartStateRef.current = { nodes, edges };
  }, [nodes, edges]);

  const onNodeDragStop = useCallback(() => {
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
  }, [nodes, edges, setPast, setFuture]);

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
      const hasRemoval = changes.some((c) => c.type === 'remove');
      if (hasRemoval) {
        takeSnapshot();
      }
      onNodesChangeState(changes);
    },
    [onNodesChangeState, takeSnapshot]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
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
    [edges, nodes, setNodes, onEdgesChangeState, takeSnapshot]
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

  useEffect(() => {
    const handleEditButton = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail.isRedispatched) {
        return;
      }
      
      const { nodeId, button } = customEvent.detail;
      setSelectedNodeId(nodeId);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
      
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

  const onConnectStart = useCallback((_event: unknown, { nodeId, handleId, handleType }: { nodeId: string | null; handleId: string | null; handleType: 'source' | 'target' | null }) => {
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
  }, [nodes, edges, setEdges, restoreTempRemovedEdge]);

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

      const elementsUnderPoint = typeof document.elementsFromPoint === 'function'
        ? document.elementsFromPoint(clientX, clientY)
        : [];

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
    [screenToFlowPosition, setEdges, nodes, edgeType, takeSnapshot, setContextMenu, restoreTempRemovedEdge]
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

    takeSnapshot();
    const newNodeId = `node_${type.toLowerCase()}_${Date.now()}`;
    const newNode: Node = {
      id: newNodeId,
      type,
      position: flowPosition,
      data: createDefaultNodeData(type),
      selected: true,
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

    tempRemovedEdgeRef.current = null;
    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false }) as Node),
      newNode
    ]);
    setEdges((eds) => {
      const filtered = eds.filter((e) => !(e.source === newEdge.source && e.sourceHandle === newEdge.sourceHandle));
      return addEdge(newEdge, filtered);
    });
    setSelectedNodeId(newNodeId);
    setContextMenu(null);
  };

  const handleUpdateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      takeSnapshotBeforeEdit();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: newData };
          }
          return node;
        })
      );
    },
    [setNodes, takeSnapshotBeforeEdit]
  );

  const handleAddAndConnectNode = useCallback((sourceNodeId: string, type: string, sourceHandle?: string) => {
    takeSnapshot();
    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const sourceNode = nodes.find((n) => n.id === sourceNodeId);
    
    const position = sourceNode 
      ? { x: sourceNode.position.x + 350, y: sourceNode.position.y }
      : { x: Math.random() * 200 + 150, y: Math.random() * 200 + 100 };

    const newNode: Node = {
      id,
      type,
      position,
      data: createDefaultNodeData(type),
      selected: true,
    };

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false }) as Node),
      newNode
    ]);

    const actualSourceHandle = sourceHandle || (sourceNode?.type === 'START' ? 'then' : 'next');

    const newEdge: Edge = {
      ...FLOW_EDGE_DEFAULTS,
      id: `edge_${sourceNodeId}_${actualSourceHandle}_${id}`,
      source: sourceNodeId,
      sourceHandle: actualSourceHandle,
      target: id,
      type: edgeType,
    };
    
    setEdges((eds) => [...eds.filter(e => !(e.source === sourceNodeId && e.sourceHandle === actualSourceHandle)), newEdge]);
    setSelectedNodeId(id);

    setTimeout(() => {
      fitView({ nodes: [{ id }], duration: 300, padding: 0.5 });
    }, 50);
  }, [nodes, setNodes, setEdges, edgeType, takeSnapshot, fitView, setSelectedNodeId]);

  const handleAddNode = (type: string) => {
    if (type === 'START') {
      const hasStart = nodes.some((n) => n.type === 'START');
      if (hasStart) {
        triggerSaveError('Flow must have exactly one START node');
        return;
      }
    }

    takeSnapshot();
    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const viewportCenter = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode: Node = {
      id,
      type,
      position: viewportCenter,
      data: createDefaultNodeData(type),
      selected: true,
    };

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false }) as Node),
      newNode
    ]);
    setSelectedNodeId(id);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const nodeToDelete = nodes.find((n) => n.id === selectedNodeId);
    if (nodeToDelete?.type === 'START') {
      triggerSaveError('You cannot delete the START node');
      return;
    }

    takeSnapshot();
    const removedEdges = edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
    const nextNodes = getNodesAfterRemovingEdges(
      nodes.filter((n) => n.id !== selectedNodeId),
      removedEdges
    );
    setNodes(nextNodes);
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  const handleAutoLayout = (direction: 'LR' | 'TB') => {
    takeSnapshot();
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
    lastSavedKeyRef.current = getFlowKey(nodes, edges);
    setIsDirty(false);
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
    let resultEdges = edges;
    if (hoveredEdgeId) {
      resultEdges = edges.map((edge) => {
        if (edge.id === hoveredEdgeId) {
          return { ...edge, zIndex: 1000 };
        }
        return edge;
      });
    }
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
      return [...resultEdges, tempEdge];
    }
    return resultEdges;
  }, [edges, contextMenu, edgeType, nodes, hoveredEdgeId]);

  const copiedNodesRef = useRef<Node[] | null>(null);
  const copiedEdgesRef = useRef<Edge[] | null>(null);

  const copySelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    copiedNodesRef.current = JSON.parse(JSON.stringify(selectedNodes));

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const internalEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );
    copiedEdgesRef.current = JSON.parse(JSON.stringify(internalEdges));
  }, [nodes, edges]);

  const pasteCopiedNodes = useCallback(() => {
    const copiedNodes = copiedNodesRef.current;
    if (!copiedNodes || copiedNodes.length === 0) return;

    takeSnapshot();

    const nodeIdMap: Record<string, string> = {};
    const buttonValueMap: Record<string, string> = {};

    const newNodes = copiedNodes.map((node) => {
      const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      nodeIdMap[node.id] = newId;

      const updatedData = { ...node.data };
      const blocksList = getBlocks(updatedData);
      const updatedBlocks = blocksList.map((block) => {
        const blockClone = { ...block };
        if (Array.isArray(blockClone.buttons)) {
          blockClone.buttons = blockClone.buttons.map((btn: ButtonData) => {
            const newValue = `btn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            if (btn.value) {
              buttonValueMap[btn.value] = newValue;
            }
            return { ...btn, value: newValue };
          });
        }
        return blockClone;
      });

      if (updatedData.blocks || blocksList.length > 1 || (blocksList[0] && blocksList[0].id !== 'default_text')) {
        updatedData.blocks = updatedBlocks;
      }

      const firstText = updatedBlocks.find((b) => b.type === 'text');
      const firstImage = updatedBlocks.find((b) => b.type === 'image');
      const allButtons: ButtonData[] = [];
      updatedBlocks.forEach((b) => {
        if (Array.isArray(b.buttons)) {
          allButtons.push(...(b.buttons as ButtonData[]));
        }
      });
      updatedData.text = firstText ? firstText.text : (updatedData.text || '');
      updatedData.imageUrl = firstImage ? firstImage.imageUrl : (updatedData.imageUrl || '');
      updatedData.buttons = allButtons;

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + 24,
          y: node.position.y + 24,
        },
        selected: true,
        data: updatedData,
      };
    });

    const copiedEdges = copiedEdgesRef.current || [];
    const newEdges = copiedEdges.map((edge) => {
      const newEdgeId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const source = nodeIdMap[edge.source];
      const target = nodeIdMap[edge.target];
      const sourceHandle = edge.sourceHandle && buttonValueMap[edge.sourceHandle]
        ? (buttonValueMap[edge.sourceHandle] as string)
        : edge.sourceHandle;

      return {
        ...edge,
        id: newEdgeId,
        source,
        target,
        sourceHandle,
      };
    });

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false }) as Node),
      ...newNodes,
    ]);

    setEdges((eds) => [
      ...eds,
      ...newEdges,
    ]);

    setSelectedNodeId(newNodes[newNodes.length - 1].id);
  }, [copiedNodesRef, copiedEdgesRef, takeSnapshot, setNodes, setEdges, setSelectedNodeId]);

  const onPaneClick = useCallback(() => {
    if (justEndedDragRef.current) return;
    setSelectedNodeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setContextMenu]);

  useEffect(() => {
    const handleCopy = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { nodeId } = customEvent.detail;
      const nodeToCopy = nodes.find((n) => n.id === nodeId);
      if (!nodeToCopy || nodeToCopy.type === 'START') return;

      takeSnapshot();
      const newId = `node_${nodeToCopy.type?.toLowerCase()}_${Date.now()}`;
      
      const updatedData = JSON.parse(JSON.stringify(nodeToCopy.data || {}));
      const blocksList = getBlocks(updatedData);
      const updatedBlocks = blocksList.map((block) => {
        const blockClone = { ...block };
        if (Array.isArray(blockClone.buttons)) {
          blockClone.buttons = blockClone.buttons.map((btn: ButtonData) => ({
            ...btn,
            value: `btn_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          }));
        }
        return blockClone;
      });

      if (updatedData.blocks || blocksList.length > 1 || (blocksList[0] && blocksList[0].id !== 'default_text')) {
        updatedData.blocks = updatedBlocks;
      }

      const allButtons: ButtonData[] = [];
      updatedBlocks.forEach((b) => {
        if (Array.isArray(b.buttons)) {
          allButtons.push(...(b.buttons as ButtonData[]));
        }
      });
      updatedData.buttons = allButtons;

      const newNode: Node = {
        ...nodeToCopy,
        id: newId,
        position: {
          x: nodeToCopy.position.x + 50,
          y: nodeToCopy.position.y + 50,
        },
        selected: true,
        data: updatedData,
      };

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false }) as Node),
        newNode,
      ]);
      setSelectedNodeId(newId);
    };

    const handleDelete = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { nodeId } = customEvent.detail;
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete || nodeToDelete.type === 'START') return;

      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    };

    const handleDeleteEdge = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { edgeId } = customEvent.detail;
      takeSnapshot();
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    };

    window.addEventListener('flow-copy-node', handleCopy);
    window.addEventListener('flow-delete-node', handleDelete);
    window.addEventListener('flow-delete-edge', handleDeleteEdge);
    return () => {
      window.removeEventListener('flow-copy-node', handleCopy);
      window.removeEventListener('flow-delete-node', handleDelete);
      window.removeEventListener('flow-delete-edge', handleDeleteEdge);
    };
  }, [nodes, selectedNodeId, setNodes, setEdges, takeSnapshot]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    displayNodes,
    displayEdges,
    onNodesChange,
    onEdgesChange,
    onNodeDragStart,
    onNodeDragStop,
    onConnect,
    onConnectStart,
    onConnectEnd,
    selectedNodeId,
    setSelectedNodeId,
    edgeType,
    setEdgeType,
    saveError,
    setSaveError,
    isAddDropdownOpen,
    setIsAddDropdownOpen,
    contextMenu,
    setContextMenu,
    handleCreateAndConnectNode,
    handleUpdateNodeData,
    handleAddNode,
    handleAddAndConnectNode,
    handleDeleteSelectedNode,
    handleAutoLayout,
    handleSaveFlow,
    selectedNode,
    saveMutation,
    isLoadingSchema,
    onSelectionChange,
    onPaneClick,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    takeSnapshot,
    isDirty,
    copySelectedNodes,
    pasteCopiedNodes,
    isValidConnection,
  };
};
