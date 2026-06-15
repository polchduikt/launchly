import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBotStore } from '../../../store/useBotStore';
import { ROUTES } from '../../../constants/routes';
import {
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import type { Connection, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import {
  useCampaignsQuery,
  useTagsQuery,
  useUpdateCampaignMutation,
  useSendCampaignMutation,
} from './useBroadcastQueries';
import { useLeadsQuery, useOrdersQuery } from '../../crm/hooks/useCrmQueries';
import type { AudienceCondition, CustomNode, FilterType } from '../types';

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

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isAudienceOpen, setIsAudienceOpen] = useState(true);
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

  const updateCampaignMut = useUpdateCampaignMutation(botId);
  const sendCampaignMut = useSendCampaignMutation(botId);

  const campaign = campaigns.find((c) => c.id === campaignId);

  useEffect(() => {
    if (campaign && nodes.length === 0) {
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
            parsedNodes = rawNodes;
          }
        }
        if (campaign.edges) {
          const rawEdges = typeof campaign.edges === 'string' ? JSON.parse(campaign.edges) : campaign.edges;
          if (Array.isArray(rawEdges)) {
            parsedEdges = rawEdges;
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
    }
  }, [campaign, nodes.length, setNodes, setEdges]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.type === 'START_AUTOMATION') {
          return {
            ...n,
            data: {
              ...n.data,
              onSelectClick: () => setIsPickOpen(true),
            },
          };
        }
        return n;
      })
    );
  }, [setNodes]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      setIsDirty(true);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
      setIsDirty(true);
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({ ...params, type: 'default' }, eds));
      setIsDirty(true);
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: { id: string }) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

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
    const id = `node_${type.toLowerCase()}_${Date.now()}`;
    let newNode: CustomNode;

    if (type === 'MESSAGE') {
      newNode = {
        id,
        type: 'MESSAGE',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: { text: 'Hello! Enter your text here.', buttons: [] },
      };
    } else if (type === 'INPUT') {
      newNode = {
        id,
        type: 'INPUT',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: { text: 'Please enter a value:', variableName: 'input_var' },
      };
    } else if (type === 'CONDITION') {
      newNode = {
        id,
        type: 'CONDITION',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: { variable: 'user_input', operator: 'equals', value: 'Yes' },
      };
    } else if (type === 'ORDER') {
      newNode = {
        id,
        type: 'ORDER',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: { productName: 'Product Name', price: '100', currency: 'UAH' },
      };
    } else if (type === 'LEAD') {
      newNode = {
        id,
        type: 'LEAD',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: { name: 'user_name', email: 'user_email', phone: 'user_phone' },
      };
    } else if (type === 'API_CALL') {
      newNode = {
        id,
        type: 'API_CALL',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: { url: 'https://api.example.com/endpoint', method: 'GET' },
      };
    } else if (type === 'END') {
      newNode = {
        id,
        type: 'END',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: {},
      };
    } else {
      newNode = {
        id,
        type: 'START_AUTOMATION',
        position: { x: Math.random() * 100 + 350, y: Math.random() * 100 + 150 },
        data: {
          automationName: '',
          onSelectClick: () => setIsPickOpen(true),
        },
      };
    }

    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setIsDirty(true);
  };

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId || selectedNodeId === 'start') return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
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
      if (isDirty) {
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
          },
        });
        setIsDirty(false);
      }

      sendCampaignMut.mutate(campaignId, {
        onSuccess: () => {
          navigate(ROUTES.BROADCASTS);
        },
      });
    } catch (err) {
      console.error('Failed to save campaign before sending:', err);
    }
  };

  const getAudienceCount = () => {
    if (conditions.length === 0) return Math.max(5, leads.length + 3);
    const hasTag = conditions.some((c) => c.field === 'tag');
    const hasOrder = conditions.some((c) => c.field === 'order');
    const hasLead = conditions.some((c) => c.field === 'lead');

    if (hasTag) return Math.max(1, Math.round(leads.length * 0.4));
    if (hasOrder) return orders.length;
    if (hasLead) return leads.length;
    return 0;
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
    onNodeClick,
    onPaneClick,
    handleUpdateNodeData,
    handleAddNode,
    handleDeleteSelectedNode,
    handleSelectAutomation,
    handleAddTagCondition,
    handleRemoveCondition,
    handleSaveDraft,
    handleSendCampaign,
    getAudienceCount,
    updateCampaignMut,
    sendCampaignMut,
  };
};
