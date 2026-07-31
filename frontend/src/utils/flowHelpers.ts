import type { Node, Edge } from '@xyflow/react';
import type { ButtonData, FlowBlock } from '../types/bot';

export const getFlowKey = (nodes: Node[], edges: Edge[]) => {
  if (nodes.length > 50) {
    const nodeSummary = nodes.map(n => `${n.id}:${n.type}:${Math.round(n.position.x)},${Math.round(n.position.y)}:${JSON.stringify(n.data).length}`).join('|');
    const edgeSummary = edges.map(e => `${e.source}->${e.target}`).join('|');
    return `${nodes.length}:${edges.length}:${nodeSummary}:${edgeSummary}`;
  }
  
  const cleanNodes = nodes.map(({ id, type, position, data }) => ({
    id,
    type,
    position: { x: Math.round(position.x), y: Math.round(position.y) },
    data,
  }));
  const cleanEdges = edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
  }));
  return JSON.stringify({ nodes: cleanNodes, edges: cleanEdges });
};

export const getNodesAfterRemovingEdges = (currentNodes: Node[], removedEdges: Edge[]): Node[] => {
  let nextNodes = [...currentNodes];
  removedEdges.forEach((edge) => {
    if (edge.source && edge.sourceHandle && edge.sourceHandle.startsWith('btn_')) {
      nextNodes = nextNodes.map((n) => {
        if (n.id === edge.source) {
          const data = n.data || {};
          const buttons = (data.buttons || []) as ButtonData[];
          let buttonsChanged = false;
          const nextButtons = buttons.map((btn) => {
            if (btn.value === edge.sourceHandle) {
              buttonsChanged = true;
              return { ...btn, actionType: '', actionTarget: '', productName: '', price: '', currency: 'UAH' };
            }
            return btn;
          });

          let blocksChanged = false;
          const blocks = (data.blocks || []) as FlowBlock[];
          const nextBlocks = blocks.map((block) => {
            if (Array.isArray(block.buttons)) {
              const blockBtns = block.buttons as ButtonData[];
              let blockBtnsChanged = false;
              const nextBlockBtns = blockBtns.map((btn) => {
                if (btn.value === edge.sourceHandle) {
                  blockBtnsChanged = true;
                  return { ...btn, actionType: '', actionTarget: '', productName: '', price: '', currency: 'UAH' };
                }
                return btn;
              });
              if (blockBtnsChanged) {
                blocksChanged = true;
                return { ...block, buttons: nextBlockBtns };
              }
            }
            return block;
          });

          if (buttonsChanged || blocksChanged) {
            const nextData = { ...data };
            if (buttonsChanged) nextData.buttons = nextButtons;
            if (blocksChanged) nextData.blocks = nextBlocks;

            if (blocksChanged) {
              const firstText = nextBlocks.find((b) => b.type === 'text');
              const firstImage = nextBlocks.find((b) => b.type === 'image');
              const allButtons: ButtonData[] = [];
              nextBlocks.forEach((b) => {
                if (Array.isArray(b.buttons)) {
                  allButtons.push(...b.buttons);
                }
              });
              nextData.text = firstText ? firstText.text : '';
              nextData.imageUrl = firstImage ? firstImage.imageUrl : '';
              nextData.buttons = allButtons;
            }

            return { ...n, data: nextData };
          }
        }
        return n;
      });
    }
  });

  return nextNodes;
};
