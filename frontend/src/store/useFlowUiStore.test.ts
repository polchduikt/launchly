import { describe, it, expect, beforeEach } from 'vitest';
import { useFlowUiStore } from './useFlowUiStore';

describe('useFlowUiStore', () => {
  beforeEach(() => {
    useFlowUiStore.setState({
      editingButtonState: null,
      pickAutomationNodeId: null,
      hoveredEdgeId: null,
      copyNodeId: null,
      deleteNodeId: null,
      deleteEdgeId: null,
    });
  });

  it('manages editingButtonState properly', () => {
    const btn = { id: 'btn_1', label: 'Click me', value: 'val_1' };
    useFlowUiStore.getState().openEditButton('node_1', btn);

    expect(useFlowUiStore.getState().editingButtonState).toEqual({
      nodeId: 'node_1',
      button: btn,
    });

    useFlowUiStore.getState().closeEditButton();
    expect(useFlowUiStore.getState().editingButtonState).toBeNull();
  });

  it('manages pickAutomationNodeId properly', () => {
    useFlowUiStore.getState().openPickAutomation('node_2');
    expect(useFlowUiStore.getState().pickAutomationNodeId).toBe('node_2');

    useFlowUiStore.getState().closePickAutomation();
    expect(useFlowUiStore.getState().pickAutomationNodeId).toBeNull();
  });

  it('manages hoveredEdgeId properly', () => {
    useFlowUiStore.getState().setHoveredEdgeId('edge_1');
    expect(useFlowUiStore.getState().hoveredEdgeId).toBe('edge_1');

    useFlowUiStore.getState().setHoveredEdgeId(null);
    expect(useFlowUiStore.getState().hoveredEdgeId).toBeNull();
  });

  it('manages copy, delete node, and delete edge requests', () => {
    useFlowUiStore.getState().requestCopyNode('node_3');
    expect(useFlowUiStore.getState().copyNodeId).toBe('node_3');
    useFlowUiStore.getState().clearCopyNode();
    expect(useFlowUiStore.getState().copyNodeId).toBeNull();

    useFlowUiStore.getState().requestDeleteNode('node_4');
    expect(useFlowUiStore.getState().deleteNodeId).toBe('node_4');
    useFlowUiStore.getState().clearDeleteNode();
    expect(useFlowUiStore.getState().deleteNodeId).toBeNull();

    useFlowUiStore.getState().requestDeleteEdge('edge_2');
    expect(useFlowUiStore.getState().deleteEdgeId).toBe('edge_2');
    useFlowUiStore.getState().clearDeleteEdge();
    expect(useFlowUiStore.getState().deleteEdgeId).toBeNull();
  });
});
