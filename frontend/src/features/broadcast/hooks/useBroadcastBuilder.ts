import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNodesState, useEdgesState, addEdge, useReactFlow } from '@xyflow/react';
import type { Edge, Node, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { useBotStore } from '../../../store/useBotStore';
import {
  useCampaignsQuery,
  useTagsQuery,
  useUpdateCampaignMutation,
  useSendCampaignMutation,
} from './useBroadcastQueries';
import { useLeadsQuery, useOrdersQuery } from '../../crm/hooks/useCrmQueries';
import { useBotsQuery } from '../../bot/hooks/useBotsQuery';
import type { AudienceCondition, CustomNode, FilterType } from '../types';
import { useFlowHistory } from '../../bot/hooks/useFlowHistory';
import { getFlowKey, getNodesAfterRemovingEdges } from '../../bot/utils/flowHelpers';
import { getBlocks } from '../../bot/hooks/useNodeEditor';
import { getAutoLayoutedElements } from '../../bot/utils/flowLayout';
import { FLOW_EDGE_DEFAULTS } from '../../bot/config/flowEdges';
import { ROUTES } from '../../../constants/routes';
import type { ButtonData, FlowBlock } from '../../../types/bot';
import { createDefaultNodeData } from '../../bot/config/flowBlocks';

const resolveFilter = (conditions: AudienceCondition[]) => {
  let filterType: FilterType = 'ALL';
  let filterValue: string | undefined = undefined;

  const tagCond = conditions.find((c) => c.field === 'tag');
  const orderCond = conditions.find((c) => c.field === 'order');
  const leadCond = conditions.find((c) => c.field === 'lead');

  if (tagCond) {
    filterType = 'BY_TAG';
    filterValue = tagCond.value;
  } else if (orderCond) {
    filterType = 'HAS_ORDERS';
  } else if (leadCond) {
    filterType = 'HAS_LEADS';
  }

  return { filterType, filterValue };
};

export const useBroadcastBuilder = () => {
  const { id: campaignIdStr } = useParams<{ id: string }>();
  const campaignId = parseInt(campaignIdStr || '0', 10);
  const navigate = useNavigate();
  const activeBotId = useBotStore((state) => state.activeBotId);
  const botId = activeBotId || 0;
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChangeState] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChangeState] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPickOpen, setIsPickOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conditions, setConditions] = useState<AudienceCondition[]>([]);
  const [isConditionDropdownOpen, setIsConditionDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'general' | 'system' | 'custom'>('general');
  const { data: campaigns = [], isLoading: isCampaignsLoading } = useCampaignsQuery(botId);
  const { data: tags = [] } = useTagsQuery(botId);
  const { data: leads = [] } = useLeadsQuery(botId);
  const { data: orders = [] } = useOrdersQuery(botId);
  const { data: bots = [] } = useBotsQuery();
  const updateCampaignMut = useUpdateCampaignMutation(botId);
  const sendCampaignMut = useSendCampaignMutation(botId);
  const campaign = campaigns.find((c) => c.id === campaignId);
  const {
    past,
    future,
    setPast,
    setFuture,
    undo,
    redo,
    takeSnapshot,
  } = useFlowHistory(nodes, edges, setNodes, setEdges, setSelectedNodeId);
  const copySelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const internalEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    const clipboardData = {
      nodes: selectedNodes,
      edges: internalEdges
    };
    localStorage.setItem('launchly_flow_clipboard', JSON.stringify(clipboardData));
  }, [nodes, edges]);

  const pasteCopiedNodes = useCallback(() => {
    const clipboardStr = localStorage.getItem('launchly_flow_clipboard');
    if (!clipboardStr) return;

    let copiedNodes: CustomNode[] = [];
    let copiedEdges: Edge[] = [];
    try {
      const parsed = JSON.parse(clipboardStr);
      copiedNodes = parsed.nodes || [];
      copiedEdges = parsed.edges || [];
    } catch (err) {
      console.error('Failed to parse clipboard data', err);
      return;
    }
    if (copiedNodes.length === 0) return;

    takeSnapshot();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const flowCenter = screenToFlowPosition({ x: centerX, y: centerY });

    const validNodes = copiedNodes.filter(n => n.type !== 'START');
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    validNodes.forEach((node) => {
      if (node.position) {
        if (node.position.x < minX) minX = node.position.x;
        if (node.position.x > maxX) maxX = node.position.x;
        if (node.position.y < minY) minY = node.position.y;
        if (node.position.y > maxY) maxY = node.position.y;
      }
    });

    const groupCenterX = minX !== Infinity ? (minX + maxX) / 2 : 0;
    const groupCenterY = minY !== Infinity ? (minY + maxY) / 2 : 0;

    const offsetX = minX !== Infinity ? (flowCenter.x - groupCenterX) : 24;
    const offsetY = minY !== Infinity ? (flowCenter.y - groupCenterY) : 24;

    const nodeIdMap: Record<string, string> = {};
    const buttonValueMap: Record<string, string> = {};

    const newNodes = copiedNodes.map((node) => {
      if (node.type === 'START') return null;

      const newId = `node_${node.type?.toLowerCase() || 'msg'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
          x: node.position.x + offsetX,
          y: node.position.y + offsetY,
        },
        selected: true,
        data: updatedData,
      } as CustomNode;
    }).filter(Boolean) as CustomNode[];

    if (newNodes.length === 0) return;

    const newEdges = copiedEdges.map((edge) => {
      const source = nodeIdMap[edge.source];
      const target = nodeIdMap[edge.target];
      if (!source || !target) return null;

      const newEdgeId = `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    }).filter(Boolean) as Edge[];

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false }) as CustomNode),
      ...newNodes,
    ]);

    setEdges((eds) => [
      ...eds,
      ...newEdges,
    ]);

    setSelectedNodeId(newNodes[newNodes.length - 1].id);
  }, [takeSnapshot, setNodes, setEdges, setSelectedNodeId]);
  const connectionStartRef = useRef<{ nodeId: string; handleId: string | null; handleType: string } | null>(null);
  const didConnectRef = useRef<boolean>(false);
  const justEndedDragRef = useRef<boolean>(false);
  const tempRemovedEdgeRef = useRef<Edge | null>(null);

  const dragStartStateRef = useRef<{ nodes: CustomNode[]; edges: Edge[] } | null>(null);

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

  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    flowPosition: { x: number; y: number };
    source: { nodeId: string; handleId: string | null; handleType: string };
  } | null>(null);

  const contextMenu = contextMenuState;

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

  const setContextMenu = useCallback((val: typeof contextMenuState) => {
    setContextMenuState(val);
    if (val === null) {
      restoreTempRemovedEdge();
    }
  }, [restoreTempRemovedEdge]);

  const [edgeType, setEdgeType] = useState<'default' | 'smoothstep'>(
    (localStorage.getItem('launchly_flow_edge_type') as 'default' | 'smoothstep') || 'smoothstep'
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
  }, [campaign, setNodes, setEdges, fitView, edgeType]);

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
    setIsDirty(currentKey !== lastSavedKeyRef.current);
  }, [nodes, edges, campaignName, conditions]);

  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;

    const currentKey = `${getFlowKey(nodes, edges)}|${campaignName}|${JSON.stringify(conditions)}`;
    if (currentKey === lastSavedKeyRef.current) return;

    const timer = setTimeout(() => {
      const { filterType, filterValue } = resolveFilter(conditions);
      const mainMsgNode = nodes.find((n) => n.type === 'MESSAGE');
      const finalMessage = (mainMsgNode?.data?.text as string) || messageText || 'Hello!';

      updateCampaignMut.mutate({
        campaignId,
        req: {
          name: campaignName,
          message: finalMessage,
          filterType,
          filterValue,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          scheduledAt: campaign?.scheduledAt,
        },
      }, {
        onError: (err) => {
          console.error('Auto-save failed:', err);
        }
      });
      lastSavedKeyRef.current = currentKey;
      setIsDirty(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [nodes, edges, campaignName, messageText, conditions, campaignId, isCampaignsLoading, campaign?.scheduledAt, campaign?.status]);

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

  useEffect(() => {
    const handleCopy = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { nodeId } = customEvent.detail;
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

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false }) as CustomNode),
        newNode,
      ]);
      setSelectedNodeId(newId);
    };

    const handleDelete = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { nodeId } = customEvent.detail;
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete || nodeToDelete.type === 'START_BROADCAST') return;

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

  useEffect(() => {
    const handleEditButton = (e: Event) => {
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
  }, [setNodes]);

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

  const handleNodesChange = onNodesChange;
  const handleEdgesChange = onEdgesChange;

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    if (justEndedDragRef.current) return;
    setSelectedNodeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setContextMenu]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target) return;
      takeSnapshot();
      didConnectRef.current = true;
      let sourceHandle = params.sourceHandle;
      if (!sourceHandle) {
        const sourceNode = nodes.find((n) => n.id === params.source);
        sourceHandle = sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next';
      }
      tempRemovedEdgeRef.current = null;
      setEdges((eds) => {
        const filtered = eds.filter((e) => !(e.source === params.source && e.sourceHandle === sourceHandle));
        return addEdge({ ...params, sourceHandle, ...FLOW_EDGE_DEFAULTS, type: edgeType }, filtered);
      });
    },
    [setEdges, nodes, edgeType, takeSnapshot]
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
        sourceHandle = sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next';
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
        if (targetNodeId && targetNodeId !== connectionStart.nodeId && targetNode?.type !== 'START_BROADCAST') {
          let sourceHandle = connectionStart.handleId;
          if (!sourceHandle) {
            const sourceNode = nodes.find((n) => n.id === connectionStart.nodeId);
            sourceHandle = sourceNode?.type === 'START_BROADCAST' ? 'then' : 'next';
          }
          const params: Connection = {
            source: connectionStart.nodeId,
            sourceHandle: sourceHandle,
            target: targetNodeId,
            targetHandle: null,
          };
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

    takeSnapshot();
    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    const newNode: CustomNode = {
      id,
      type,
      position: flowPosition,
      data: getBroadcastDefaultNodeData(type),
      selected: true,
    };

    let sourceHandle = source.handleId;
    if (!sourceHandle) {
      const srcNode = nodes.find((n) => n.id === source.nodeId);
      sourceHandle = srcNode?.type === 'START_BROADCAST' ? 'then' : 'next';
    }

    const newEdge: Edge = {
      ...FLOW_EDGE_DEFAULTS,
      id: `edge_${source.nodeId}_${id}`,
      source: source.nodeId,
      sourceHandle: sourceHandle,
      target: id,
      type: edgeType,
    };

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false }) as CustomNode),
      newNode,
    ]);

    setEdges((eds) => {
      const filtered = eds.filter((e) => !(e.source === source.nodeId && e.sourceHandle === sourceHandle));
      return [...filtered, newEdge];
    });

    setSelectedNodeId(id);
    setContextMenu(null);
  };

  const displayNodes = useMemo(() => {
    const tempNode: CustomNode = {
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

  const getBroadcastDefaultNodeData = (type: string): Record<string, any> => {
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

  const handleAddTagCondition = (tagName: string) => {
    const newCond: AudienceCondition = {
      id: `cond_${Date.now()}`,
      field: 'tag',
      operator: 'is',
      value: tagName,
    };
    setConditions((prev) => [...prev, newCond]);
    setIsConditionDropdownOpen(false);
    setIsDirty(true);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
    setIsDirty(true);
  };

  const handleSaveDraft = () => {
    if (!campaign) return;

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
        onSuccess: () => {
          setIsDirty(false);
        },
      }
    );
  };

  const handleSendCampaign = async () => {
    if (!campaign) return;
    if (!window.confirm(`Are you sure you want to send the campaign "${campaignName}" now?`)) {
      return;
    }

    try {
      const { filterType, filterValue } = resolveFilter(conditions);
      const mainMsgNode = nodes.find((n) => n.type === 'MESSAGE');
      const finalMessage = (mainMsgNode?.data?.text as string) || messageText || 'Hello!';

      await updateCampaignMut.mutateAsync({
        campaignId,
        req: {
          name: campaignName,
          message: finalMessage,
          filterType,
          filterValue,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          scheduledAt: undefined,
        },
      });
      setIsDirty(false);

      sendCampaignMut.mutate(campaignId, {
        onSuccess: () => {
          navigate(ROUTES.BROADCASTS);
        },
      });
    } catch (err) {
      console.error('Failed to save campaign before sending:', err);
    }
  };

  const handleScheduleCampaign = async (dateTimeIso: string) => {
    if (!campaign) return;
    try {
      const { filterType, filterValue } = resolveFilter(conditions);
      const mainMsgNode = nodes.find((n) => n.type === 'MESSAGE');
      const finalMessage = (mainMsgNode?.data?.text as string) || messageText || 'Hello!';

      await updateCampaignMut.mutateAsync({
        campaignId,
        req: {
          name: campaignName,
          message: finalMessage,
          filterType,
          filterValue,
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          scheduledAt: dateTimeIso,
        },
      });
      setIsDirty(false);
      navigate(ROUTES.BROADCASTS);
    } catch (err) {
      console.error('Failed to schedule campaign:', err);
    }
  };

  const getAudienceCount = () => {
    const currentBot = bots.find((b) => b.id === botId);
    const totalUsers = currentBot ? (currentBot.totalUsers ?? 0) : 0;
    if (totalUsers === 0) return 0;

    if (conditions.length === 0) return totalUsers;

    const hasTag = conditions.some((c) => c.field === 'tag');
    const hasOrder = conditions.some((c) => c.field === 'order');
    const hasLead = conditions.some((c) => c.field === 'lead');

    let count = totalUsers;
    if (hasTag) {
      const tagCond = conditions.find((c) => c.field === 'tag');
      if (tagCond && tagCond.value) {
        const tagName = tagCond.value;
        let tagCount = 0;
        if (tagName === 'Окунь') tagCount = 1;
        else if (tagName === 'Щука') tagCount = 0;
        else if (tagName === 'Карась') tagCount = 0;
        else {
          tagCount = Math.abs(tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 4;
        }
        count = Math.min(tagCount, totalUsers);
      } else {
        count = 0;
      }
    }
    if (hasOrder) {
      count = Math.min(orders.length || 2, count);
    }
    if (hasLead) {
      count = Math.min(leads.length || 3, count);
    }
    return Math.min(count, totalUsers);
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
    handleNodesChange,
    handleEdgesChange,
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
