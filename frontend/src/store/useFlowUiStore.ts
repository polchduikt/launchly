import { create } from 'zustand';
import type { ButtonData } from '../types';

export interface FlowEditingButtonState {
  nodeId: string;
  button: ButtonData;
}

export interface FlowUiState {
  // Editing button dialog/drawer
  editingButtonState: FlowEditingButtonState | null;
  openEditButton: (nodeId: string, button: ButtonData) => void;
  closeEditButton: () => void;

  // Automation picker modal
  pickAutomationNodeId: string | null;
  openPickAutomation: (nodeId: string) => void;
  closePickAutomation: () => void;

  // Hovered edge highlight
  hoveredEdgeId: string | null;
  setHoveredEdgeId: (edgeId: string | null) => void;

  // Node/edge action requests
  copyNodeId: string | null;
  requestCopyNode: (nodeId: string) => void;
  clearCopyNode: () => void;

  deleteNodeId: string | null;
  requestDeleteNode: (nodeId: string) => void;
  clearDeleteNode: () => void;

  deleteEdgeId: string | null;
  requestDeleteEdge: (edgeId: string) => void;
  clearDeleteEdge: () => void;
}

export const useFlowUiStore = create<FlowUiState>((set) => ({
  editingButtonState: null,
  openEditButton: (nodeId: string, button: ButtonData) => {
    set({ editingButtonState: { nodeId, button } });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edit-flow-button', { detail: { nodeId, button } }));
    }
  },
  closeEditButton: () => set({ editingButtonState: null }),

  pickAutomationNodeId: null,
  openPickAutomation: (nodeId: string) => {
    set({ pickAutomationNodeId: nodeId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-pick-automation', { detail: { nodeId } }));
    }
  },
  closePickAutomation: () => set({ pickAutomationNodeId: null }),

  hoveredEdgeId: null,
  setHoveredEdgeId: (edgeId: string | null) => {
    set({ hoveredEdgeId: edgeId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flow-hover-edge', { detail: edgeId ? { edgeId } : null }));
    }
  },

  copyNodeId: null,
  requestCopyNode: (nodeId: string) => {
    set({ copyNodeId: nodeId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flow-copy-node', { detail: { nodeId } }));
    }
  },
  clearCopyNode: () => set({ copyNodeId: null }),

  deleteNodeId: null,
  requestDeleteNode: (nodeId: string) => {
    set({ deleteNodeId: nodeId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flow-delete-node', { detail: { nodeId } }));
    }
  },
  clearDeleteNode: () => set({ deleteNodeId: null }),

  deleteEdgeId: null,
  requestDeleteEdge: (edgeId: string) => {
    set({ deleteEdgeId: edgeId });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flow-delete-edge', { detail: { edgeId } }));
    }
  },
  clearDeleteEdge: () => set({ deleteEdgeId: null }),
}));
