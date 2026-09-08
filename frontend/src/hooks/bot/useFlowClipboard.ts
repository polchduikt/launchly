import { useEffect, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { generateId } from '../../utils/id';
import { getBlocks } from './useNodeEditor';
import type { ButtonData } from '../../types/bot';
import { STORAGE_KEYS } from '../../const/constants';
import { useFlowUiStore } from '../../store/useFlowUiStore';

interface UseFlowClipboardParams {
  nodes: Node[];
  edges: Edge[];
  setNodes: (update: Node[] | ((nds: Node[]) => Node[])) => void;
  setEdges: (update: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  takeSnapshot: () => void;
  screenToFlowPosition: (clientPos: { x: number; y: number }) => { x: number; y: number };
}

export const useFlowClipboard = ({
  nodes,
  edges,
  setNodes,
  setEdges,
  selectedNodeId,
  setSelectedNodeId,
  takeSnapshot,
  screenToFlowPosition,
}: UseFlowClipboardParams) => {
  const copySelectedNodes = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const internalEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    const clipboardData = {
      nodes: selectedNodes,
      edges: internalEdges,
    };
    localStorage.setItem(STORAGE_KEYS.FLOW_CLIPBOARD, JSON.stringify(clipboardData));
  }, [nodes, edges]);

  const pasteCopiedNodes = useCallback(() => {
    const clipboardStr = localStorage.getItem(STORAGE_KEYS.FLOW_CLIPBOARD);
    if (!clipboardStr) return;

    let copiedNodes: Node[] = [];
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

    const validNodes = copiedNodes.filter((n) => n.type !== 'START');
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

    const offsetX = minX !== Infinity ? flowCenter.x - groupCenterX : 24;
    const offsetY = minY !== Infinity ? flowCenter.y - groupCenterY : 24;

    const nodeIdMap: Record<string, string> = {};
    const buttonValueMap: Record<string, string> = {};

    const newNodes = copiedNodes
      .map((node) => {
        if (node.type === 'START') return null;

        const newId = generateId(`node_${node.type?.toLowerCase() || 'msg'}`);
        nodeIdMap[node.id] = newId;

        const updatedData = { ...node.data };
        const blocksList = getBlocks(updatedData);
        const updatedBlocks = blocksList.map((block) => {
          const blockClone = { ...block };
          if (Array.isArray(blockClone.buttons)) {
            blockClone.buttons = blockClone.buttons.map((btn: ButtonData) => {
              const newValue = generateId('btn');
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
        updatedData.text = firstText ? firstText.text : updatedData.text || '';
        updatedData.imageUrl = firstImage ? firstImage.imageUrl : updatedData.imageUrl || '';
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
        };
      })
      .filter(Boolean) as Node[];

    if (newNodes.length === 0) return;

    const newEdges = copiedEdges
      .map((edge) => {
        const source = nodeIdMap[edge.source];
        const target = nodeIdMap[edge.target];
        if (!source || !target) return null;

        const newEdgeId = generateId('edge');
        const sourceHandle =
          edge.sourceHandle && buttonValueMap[edge.sourceHandle]
            ? (buttonValueMap[edge.sourceHandle] as string)
            : edge.sourceHandle;

        return {
          ...edge,
          id: newEdgeId,
          source,
          target,
          sourceHandle,
        };
      })
      .filter(Boolean) as Edge[];

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false }) as Node), ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
    setSelectedNodeId(newNodes[newNodes.length - 1].id);
  }, [takeSnapshot, setNodes, setEdges, setSelectedNodeId, screenToFlowPosition]);

  const handleCopyNode = useCallback(
    (nodeId: string) => {
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

      setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false }) as Node), newNode]);
      setSelectedNodeId(newId);
    },
    [nodes, setNodes, setSelectedNodeId, takeSnapshot]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete || nodeToDelete.type === 'START') return;

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
      if (state.pickAutomationNodeId && state.pickAutomationNodeId !== prevState.pickAutomationNodeId) {
        const nodeId = state.pickAutomationNodeId;
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

    window.addEventListener('edit-flow-button', handleLegacyEditButton);
    window.addEventListener('flow-copy-node', handleLegacyCopy);
    window.addEventListener('flow-delete-node', handleLegacyDelete);
    window.addEventListener('flow-delete-edge', handleLegacyDeleteEdge);

    return () => {
      unsub();
      window.removeEventListener('edit-flow-button', handleLegacyEditButton);
      window.removeEventListener('flow-copy-node', handleLegacyCopy);
      window.removeEventListener('flow-delete-node', handleLegacyDelete);
      window.removeEventListener('flow-delete-edge', handleLegacyDeleteEdge);
    };
  }, [handleCopyNode, handleDeleteNode, handleDeleteEdge, setNodes, setSelectedNodeId]);

  return {
    copySelectedNodes,
    pasteCopiedNodes,
  };
};
