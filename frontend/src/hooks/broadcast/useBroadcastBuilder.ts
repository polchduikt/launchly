import { useState, useEffect, useCallback, useRef, useMemo, type MutableRefObject, type SetStateAction } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import type { Edge, Node, NodeChange, EdgeChange } from '@xyflow/react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { useBotStore } from '../../store/useBotStore';
import { useFlowUiStore } from '../../store/useFlowUiStore';
import {
  useTagsQuery,
  useUpdateCampaignMutation,
  useSendCampaignMutation,
} from './useBroadcastQueries';
import { getCampaignsApi } from '../../api/broadcast';
import { queryKeys } from '../../api/queryKeys';
import { useLeadsQuery, useOrdersQuery } from '../crm/useCrmQueries';
import { useBotsQuery } from '../bot/useBotsQuery';
import type { CampaignResponse } from '../../types';
import type { CustomNode } from '../../types/broadcast';
import { useFlowHistory } from '../bot/useFlowHistory';
import { getFlowKey, getNodesAfterRemovingEdges } from '../../utils/flowHelpers';
import { getBlocks } from '../bot/useNodeEditor';
import { FLOW_EDGE_DEFAULTS } from '../../const/flowEdges';
import type { ButtonData } from '../../types/bot';
import { createDefaultNodeData } from '../../const/flowBlocks';
import { generateId } from '../../utils/id';
import { TIMING } from '../../const/constants';
import { useBroadcastAudience, resolveFilter } from './useBroadcastAudience';
import { useBroadcastScheduler } from './useBroadcastScheduler';
import { useBroadcastClipboard } from './useBroadcastClipboard';
import { useBroadcastConnections } from './useBroadcastConnections';

const getBroadcastDefaultNodeData = (type: string): Record<string, unknown> => {
  switch (type) {
    case 'INPUT':
      return { text: 'Please enter a value:', variableName: 'input_var' };
    case 'ORDER':
      return { productName: 'Product Name', price: '100', currency: 'UAH' };
    case 'LEAD':
      return { name: 'user_name', email: 'user_email', phone: 'user_phone' };
    default:
      return createDefaultNodeData(type);
  }
};

export const useBroadcastBuilder = (isLocalChangeRef?: MutableRefObject<boolean>) => {
  const { id: campaignIdStr } = useParams<{ id: string }>();
  const campaignId = parseInt(campaignIdStr || '0', 10);
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const botId = activeBotId || 0;
  const { screenToFlowPosition, fitView } = useReactFlow();

  const [nodes, setNodesRaw, onNodesChangeState] = useNodesState<CustomNode>([]);
  const [edges, setEdgesRaw, onEdgesChangeState] = useEdgesState<Edge>([]);

  const setNodes = useCallback(
    (update: SetStateAction<CustomNode[]>) => {
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      setNodesRaw(update);
    },
    [setNodesRaw, isLocalChangeRef]
  );

  const setEdges = useCallback(
    (update: SetStateAction<Edge[]>) => {
      if (isLocalChangeRef) {
        isLocalChangeRef.current = true;
      }
      setEdgesRaw(update);
    },
    [setEdgesRaw, isLocalChangeRef]
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPickOpen, setIsPickOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bots = [], isLoading: isBotsLoading } = useBotsQuery();
  const targetBotId = activeBotId || (bots.length > 0 ? bots[0].id : 0);

  const { data: targetCampaigns = [], isLoading: isTargetCampaignsLoading } = useQuery({
    queryKey: queryKeys.broadcasts.campaigns(targetBotId),
    queryFn: () => getCampaignsApi(targetBotId),
    enabled: targetBotId > 0,
    refetchInterval: (query: { state: { data?: CampaignResponse[] } }) => {
      const data = query.state.data;
      if (!data || !campaignId) return false;
      const currentCampaign = data.find((c) => c.id === campaignId);
      return currentCampaign?.status === 'IN_PROGRESS' || currentCampaign?.status === 'SCHEDULED'
        ? TIMING.POLL_INTERVAL_MS
        : false;
    },
  });

  const campaignFoundInTarget = targetCampaigns.some((c) => c.id === campaignId);
  const fallbackBots = useMemo(
    () => (campaignId > 0 && !campaignFoundInTarget ? bots.filter((b) => b.id !== targetBotId) : []),
    [campaignId, campaignFoundInTarget, bots, targetBotId]
  );

  const fallbackQueries = useQueries({
    queries: fallbackBots.map((bot) => ({
      queryKey: queryKeys.broadcasts.campaigns(bot.id),
      queryFn: () => getCampaignsApi(bot.id),
      enabled: fallbackBots.length > 0,
      staleTime: 60_000,
    })),
  });

  const fallbackCampaigns = fallbackQueries.flatMap((q) => q.data || []);
  const allCampaigns = [...targetCampaigns, ...fallbackCampaigns];
  const campaign = allCampaigns.find((c) => c.id === campaignId);
  const campaignBotId = campaign?.botId || targetBotId || botId;

  const isCampaignsLoading =
    isBotsLoading ||
    isTargetCampaignsLoading ||
    (fallbackBots.length > 0 && fallbackQueries.some((q) => q.isLoading));

  const { data: tags = [] } = useTagsQuery(campaignBotId);
  const { data: leads = [] } = useLeadsQuery(campaignBotId);
  const { data: orders = [] } = useOrdersQuery(campaignBotId);
  const updateCampaignMut = useUpdateCampaignMutation(campaignBotId);
  const sendCampaignMut = useSendCampaignMutation(campaignBotId);

  const {
    isAudienceOpen,
    setIsAudienceOpen,
    conditions,
    setConditions,
    isConditionDropdownOpen,
    setIsConditionDropdownOpen,
    selectedCategory,
    setSelectedCategory,
    handleAddTagCondition,
    handleRemoveCondition,
    getAudienceCount,
  } = useBroadcastAudience({
    bots,
    botId,
    orders,
    leads,
    setIsDirty,
  });

  const {
    handleSaveDraft,
    handleSendCampaign,
    handleScheduleCampaign,
  } = useBroadcastScheduler({
    campaign,
    campaignId,
    campaignName,
    conditions,
    nodes,
    edges,
    messageText,
    updateCampaignMut,
    sendCampaignMut,
    setIsDirty,
    navigate,
  });

  const {
    past,
    future,
    setPast,
    setFuture,
    undo,
    redo,
    takeSnapshot,
  } = useFlowHistory(
    nodes as unknown as Node[],
    edges,
    setNodes as unknown as React.Dispatch<React.SetStateAction<Node[]>>,
    setEdges as unknown as React.Dispatch<React.SetStateAction<Edge[]>>,
    setSelectedNodeId
  );

  const { copySelectedNodes, pasteCopiedNodes } = useBroadcastClipboard({
    nodes,
    edges,
    setNodes,
    setEdges,
    setSelectedNodeId,
    takeSnapshot,
    screenToFlowPosition,
  });

  const {
    onConnect,
    onConnectStart,
    onConnectEnd,
    onPaneClick,
    contextMenu,
    setContextMenu,
    handleCreateAndConnectNode,
    edgeType,
    setEdgeType,
    hoveredEdgeId,
  } = useBroadcastConnections({
    nodes,
    edges,
    setNodes,
    setEdges,
    takeSnapshot,
    screenToFlowPosition,
    setSelectedNodeId,
    getDefaultNodeData: getBroadcastDefaultNodeData,
  });

  const dragStartStateRef = useRef<{ nodes: CustomNode[]; edges: Edge[] } | null>(null);

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

  const isCampaignLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    isCampaignLoadedRef.current = false;
  }, [campaignId]);

  useEffect(() => {
    if (campaign && !isCampaignLoadedRef.current) {
      isCampaignLoadedRef.current = true;
      setCampaignName(campaign.name);
      setMessageText(campaign.message || '');

      if (campaign.filterType === 'BY_TAG' && campaign.filterValue) {
        setConditions([
          {
            id: 'cond-1',
            field: 'tag',
            operator: 'is',
            value: campaign.filterValue,
          },
        ]);
      } else if (campaign.filterType === 'HAS_ORDERS') {
        setConditions([{ id: 'cond-1', field: 'order', operator: 'is', value: 'Any Order' }]);
      } else if (campaign.filterType === 'HAS_LEADS') {
        setConditions([{ id: 'cond-1', field: 'lead', operator: 'is', value: 'Any Lead' }]);
      }

      let parsedNodes: CustomNode[] = [];
      let parsedEdges: Edge[] = [];

      try {
        if (campaign.nodes) {
          const rawNodes = typeof campaign.nodes === 'string' ? JSON.parse(campaign.nodes) : campaign.nodes;
          if (Array.isArray(rawNodes) && rawNodes.length > 0) {
            parsedNodes = rawNodes.map((n) => ({ ...n, selected: false }));
          }
        }
        if (campaign.edges) {
          const rawEdges = typeof campaign.edges === 'string' ? JSON.parse(campaign.edges) : campaign.edges;
          if (Array.isArray(rawEdges)) {
            parsedEdges = rawEdges.map((edge) => {
              let sourceHandle = edge.sourceHandle;
              if (!sourceHandle) {
                const sourceNode = parsedNodes.find((n) => n.id === edge.source);
                sourceHandle = sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next';
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
        }
      } catch (e) {
        console.error('Failed to parse campaign flow schema', e);
      }

      if (parsedNodes.length === 0) {
        parsedNodes = [
          {
            id: 'start',
            type: 'START_BROADCAST',
            position: { x: 100, y: 150 },
            data: {},
          },
        ];
        parsedEdges = [];
      }

      setNodes(parsedNodes);
      setEdges(parsedEdges);

      setTimeout(() => {
        fitView({ padding: 0.6 });
      }, 50);
    }
  }, [campaign, setNodes, setEdges, fitView, edgeType, setConditions]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === 'START_AUTOMATION') {
          return {
            ...n,
            data: {
              ...n.data,
              onSelectClick: () => {
                setSelectedNodeId(n.id);
                setIsPickOpen(true);
              },
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  const lastSavedKeyRef = useRef<string>('');
  const isInitialLoadDoneRef = useRef<boolean>(false);

  useEffect(() => {
    isInitialLoadDoneRef.current = false;
  }, [campaignId]);

  useEffect(() => {
    if (!isCampaignsLoading && nodes.length > 0 && campaignName) {
      if (!isInitialLoadDoneRef.current) {
        isInitialLoadDoneRef.current = true;
        lastSavedKeyRef.current = `${getFlowKey(nodes, edges)}|${campaignName}|${JSON.stringify(conditions)}`;
      }
    }
  }, [isCampaignsLoading, nodes, edges, campaignName, conditions]);

  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;
    const currentKey = `${getFlowKey(nodes, edges)}|${campaignName}|${JSON.stringify(conditions)}`;
    if (currentKey === lastSavedKeyRef.current) {
      setIsDirty(false);
      return;
    }
    if (isLocalChangeRef && !isLocalChangeRef.current) {
      return;
    }

    setIsDirty(true);
  }, [nodes, edges, campaignName, conditions, isLocalChangeRef]);

  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;

    const currentKey = `${getFlowKey(nodes, edges)}|${campaignName}|${JSON.stringify(conditions)}`;
    if (currentKey === lastSavedKeyRef.current) return;
    if (isLocalChangeRef && !isLocalChangeRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      const { filterType, filterValue } = resolveFilter(conditions);
      const mainMsgNode = nodes.find((n) => n.type === 'MESSAGE');
      const finalMessage = (mainMsgNode?.data?.text as string) || messageText || 'Hello!';

      updateCampaignMut.mutate(
        {
          campaignId,
          req: {
            name: campaignName,
            message: finalMessage,
            filterType,
            filterValue,
            nodes: JSON.stringify(nodes),
            edges: JSON.stringify(edges),
          },
        },
        {
          onError: (err) => {
            console.error('Auto-save failed:', err);
          },
        }
      );
      lastSavedKeyRef.current = currentKey;
      setIsDirty(false);
      if (isLocalChangeRef) {
        isLocalChangeRef.current = false;
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [nodes, edges, campaignName, messageText, conditions, campaignId, isCampaignsLoading, campaign?.status, updateCampaignMut, isLocalChangeRef]);

  const handleCopyNode = useCallback(
    (nodeId: string) => {
      const nodeToCopy = nodes.find((n) => n.id === nodeId);
      if (!nodeToCopy || nodeToCopy.type === 'START_BROADCAST') return;

      takeSnapshot();
      const newId = `node_${nodeToCopy.type?.toLowerCase()}_${Date.now()}`;

      const updatedData = JSON.parse(JSON.stringify(nodeToCopy.data || {}));
      const blocksList = getBlocks(updatedData);
      const updatedBlocks = blocksList.map((block) => {
        const blockClone = { ...block };
        if (Array.isArray(blockClone.buttons)) {
          blockClone.buttons = blockClone.buttons.map((btn: ButtonData) => ({
            ...btn,
            value: generateId('btn'),
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

      const newNode: CustomNode = {
        ...nodeToCopy,
        id: newId,
        position: {
          x: nodeToCopy.position.x + 50,
          y: nodeToCopy.position.y + 50,
        },
        selected: true,
        data: updatedData,
      };

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false }) as CustomNode), newNode]);
      setSelectedNodeId(newId);
    },
    [nodes, setNodes, setSelectedNodeId, takeSnapshot]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete || nodeToDelete.type === 'START_BROADCAST') return;

      takeSnapshot();
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
    },
    [nodes, selectedNodeId, setNodes, setEdges, setSelectedNodeId, takeSnapshot]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      takeSnapshot();
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges, takeSnapshot]
  );

  useEffect(() => {
    const unsub = useFlowUiStore.subscribe((state, prevState) => {
      if (state.editingButtonState && state.editingButtonState !== prevState.editingButtonState) {
        const { nodeId } = state.editingButtonState;
        setSelectedNodeId(nodeId);
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === nodeId,
          }))
        );
      }
      if (state.copyNodeId && state.copyNodeId !== prevState.copyNodeId) {
        const nodeId = state.copyNodeId;
        useFlowUiStore.getState().clearCopyNode();
        handleCopyNode(nodeId);
      }
      if (state.deleteNodeId && state.deleteNodeId !== prevState.deleteNodeId) {
        const nodeId = state.deleteNodeId;
        useFlowUiStore.getState().clearDeleteNode();
        handleDeleteNode(nodeId);
      }
      if (state.deleteEdgeId && state.deleteEdgeId !== prevState.deleteEdgeId) {
        const edgeId = state.deleteEdgeId;
        useFlowUiStore.getState().clearDeleteEdge();
        handleDeleteEdge(edgeId);
      }
    });

    const handleLegacyCopy = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleCopyNode(customEvent.detail.nodeId);
    };

    const handleLegacyDelete = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleDeleteNode(customEvent.detail.nodeId);
    };

    const handleLegacyDeleteEdge = (e: Event) => {
      const customEvent = e as CustomEvent;
      handleDeleteEdge(customEvent.detail.edgeId);
    };

    const handleLegacyEditButton = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.isRedispatched) return;
      const { nodeId, button } = customEvent.detail;
      setSelectedNodeId(nodeId);
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          selected: n.id === nodeId,
        }))
      );
      if (button) {
        useFlowUiStore.getState().openEditButton(nodeId, button);
      }
    };

    window.addEventListener('flow-copy-node', handleLegacyCopy);
    window.addEventListener('flow-delete-node', handleLegacyDelete);
    window.addEventListener('flow-delete-edge', handleLegacyDeleteEdge);
    window.addEventListener('edit-flow-button', handleLegacyEditButton);

    return () => {
      unsub();
      window.removeEventListener('flow-copy-node', handleLegacyCopy);
      window.removeEventListener('flow-delete-node', handleLegacyDelete);
      window.removeEventListener('flow-delete-edge', handleLegacyDeleteEdge);
      window.removeEventListener('edit-flow-button', handleLegacyEditButton);
    };
  }, [handleCopyNode, handleDeleteNode, handleDeleteEdge, setNodes, setSelectedNodeId]);

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

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const displayNodes = useMemo(() => {
    const tempNode: CustomNode = {
      id: 'temp_menu_node',
      type: 'TEMP',
      position: contextMenu ? contextMenu.flowPosition : nodes[0]?.position || { x: 0, y: 0 },
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
            sourceHandle = node.type === 'START_BROADCAST' ? 'then' : 'next';
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
        sourceHandle = srcNode?.type === 'START_BROADCAST' ? 'then' : 'next';
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

  const handleUpdateNodeData = (nodeId: string, newData: Record<string, unknown>) => {
    setIsDirty(true);
    if (nodeId === 'message' || nodeId === 'node_message') {
      setMessageText((newData.text as string) || '');
    }
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  const handleAddNode = (type: string) => {
    takeSnapshot();
    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const viewportCenter = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const newNode: CustomNode = {
      id,
      type,
      position: viewportCenter,
      data: getBroadcastDefaultNodeData(type),
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setIsDirty(true);
  };

  const handleAddAndConnectNode = useCallback(
    (sourceId: string, type: string, sourceHandle: string | null = null) => {
      const id = `node_${type.toLowerCase()}_${Date.now()}`;
      const sourceNode = nodes.find((n) => n.id === sourceId);
      const position = sourceNode
        ? { x: sourceNode.position.x + 320, y: sourceNode.position.y }
        : { x: 100, y: 150 };

      const newNode: CustomNode = {
        id,
        type,
        position,
        data: getBroadcastDefaultNodeData(type),
      };

      const newEdge: Edge = {
        ...FLOW_EDGE_DEFAULTS,
        id: `edge_${sourceId}_${id}`,
        source: sourceId,
        sourceHandle: sourceHandle || (sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next'),
        target: id,
        type: edgeType,
      };

      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => {
        const filtered = eds.filter((e) => !(e.source === sourceId && e.sourceHandle === newEdge.sourceHandle));
        return [...filtered, newEdge];
      });
      setSelectedNodeId(id);
      setIsDirty(true);
    },
    [nodes, setNodes, setEdges, edgeType]
  );

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId || selectedNodeId === 'start') return;
    const removedEdges = edges.filter((e) => e.source === selectedNodeId || e.target === selectedNodeId);
    const nextNodes = getNodesAfterRemovingEdges(
      nodes.filter((n) => n.id !== selectedNodeId),
      removedEdges
    );
    setNodes(nextNodes);
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
    setIsDirty(true);
  };

  const handleSelectAutomation = (autoName: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId && n.type === 'START_AUTOMATION') {
          return { ...n, data: { ...n.data, automationName: autoName } };
        }
        return n;
      })
    );
    setIsPickOpen(false);
    setIsDirty(true);
  };

  const activeNode = nodes.find((n) => n.id === selectedNodeId);

  return {
    campaignId,
    botId,
    activeBotId,
    campaign,
    nodes,
    setNodes,
    edges,
    setEdges,
    setNodesRemote: setNodesRaw,
    setEdgesRemote: setEdgesRaw,
    displayNodes,
    displayEdges,
    selectedNodeId,
    setSelectedNodeId,
    campaignName,
    setCampaignName,
    isEditingName,
    setIsEditingName,
    messageText,
    setMessageText,
    isDirty,
    setIsDirty,
    isAudienceOpen,
    setIsAudienceOpen,
    isPreviewOpen,
    setIsPreviewOpen,
    isPickOpen,
    setIsPickOpen,
    searchQuery,
    setSearchQuery,
    conditions,
    setConditions,
    isConditionDropdownOpen,
    setIsConditionDropdownOpen,
    selectedCategory,
    setSelectedCategory,
    isCampaignsLoading,
    tags,
    leads,
    orders,
    activeNode,
    handleNodesChange: onNodesChange,
    handleEdgesChange: onEdgesChange,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onNodeClick,
    onPaneClick,
    onNodeDragStart,
    onNodeDragStop,
    handleUpdateNodeData,
    handleAddNode,
    handleAddAndConnectNode,
    handleDeleteSelectedNode,
    handleSelectAutomation,
    handleAddTagCondition,
    handleRemoveCondition,
    handleSaveDraft,
    handleSendCampaign,
    handleScheduleCampaign,
    getAudienceCount,
    updateCampaignMut,
    sendCampaignMut,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    takeSnapshot,
    copySelectedNodes,
    pasteCopiedNodes,
    edgeType,
    setEdgeType,
    contextMenu,
    setContextMenu,
    handleCreateAndConnectNode,
    onSelectionChange,
  };
};
