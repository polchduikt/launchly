import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageNodeEditor } from './MessageNodeEditor';
import { ReactFlowProvider } from '@xyflow/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: string) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../store/useBotStore', () => ({
  useBotStore: (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector({ activeBotId: 1 }) : { activeBotId: 1 },
}));

vi.mock('../../../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
}));

vi.mock('../../../../../../hooks/bot/useNodeEditor', () => ({
  getBlocks: () => [
    { id: 'b1', type: 'text', text: 'Hello' },
    { id: 'b2', type: 'image', imageUrl: 'http://img.png' },
    { id: 'b3', type: 'file', fileName: 'doc.pdf' },
    { id: 'b4', type: 'audio', fileName: 'voice.mp3' },
    { id: 'b5', type: 'video', fileName: 'clip.mp4' },
    { id: 'b6', type: 'delay', delaySeconds: 5 },
    { id: 'b7', type: 'user_input', variableName: 'email' },
  ],
  useNodeEditor: () => ({
    isNextStepDrawerOpen: false,
    setIsNextStepDrawerOpen: vi.fn(),
    nextStepSourceHandle: null,
    setNextStepSourceHandle: vi.fn(),
    handleAddNextStep: vi.fn(),
  }),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ReactFlowProvider>{children}</ReactFlowProvider>
  </QueryClientProvider>
);

describe('MessageNodeEditor', () => {
  it('renders MessageNodeEditor and blocks properly', () => {
    const mockEditorState = {
      isBtnDialogOpen: false,
      setIsBtnDialogOpen: vi.fn(),
      editingButton: null,
      setEditingButton: vi.fn(),
      editingButtonBlockId: null,
      setEditingButtonBlockId: vi.fn(),
      handleSaveButton: vi.fn(),
      handleDeleteButton: vi.fn(),
      handleCreateButton: vi.fn(),
      handleOpenCreateButtonDialog: vi.fn(),
      handleOpenEditButtonDialog: vi.fn(),
      activePopoverButton: null,
      setActivePopoverButton: vi.fn(),
      handleOpenButtonSettings: vi.fn(),
      handleCloseButtonSettings: vi.fn(),
      handleUpdateBlockField: vi.fn(),
      handleAddBlock: vi.fn(),
      handleRemoveBlock: vi.fn(),
      handleReorderBlocks: vi.fn(),
      handleUpdateNodeData: vi.fn(),
      handleDuplicateBlock: vi.fn(),
      handleSaveNextStep: vi.fn(),
      handleCreateAndConnectNode: vi.fn(),
      isNextStepDrawerOpen: false,
      setIsNextStepDrawerOpen: vi.fn(),
      nextStepSourceHandle: null,
      setNextStepSourceHandle: vi.fn(),
      handleAddNextStep: vi.fn(),
      isEditDataCollectionDrawerOpen: false,
      editingDataCollectionBlock: null,
      handleOpenEditDataCollection: vi.fn(),
      handleCloseEditDataCollection: vi.fn(),
      handleSaveDataCollection: vi.fn(),
      handleRemoveDataCollection: vi.fn(),
      handleUpdateDataCollection: vi.fn(),
    };

    render(
      <MessageNodeEditor
        nodeId="node_1"
        editorState={mockEditorState as unknown as never}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('flow_builder.text_block')).toBeInTheDocument();
  });
});
