import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageNodeEditor } from '../MessageNodeEditor';
import { ReactFlowProvider } from '@xyflow/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('../../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../../store/useBotStore', () => ({
  useBotStore: (selector: any) => selector ? selector({ activeBotId: 1 }) : ({ activeBotId: 1 }),
}));

vi.mock('../../../../../../../hooks/broadcast/useBroadcastQueries', () => ({
  useTagsQuery: () => ({ data: [] }),
}));

vi.mock('@emoji-mart/react', () => ({
  default: () => <div data-testid="emoji-picker" />,
}));
vi.mock('@emoji-mart/data', () => ({
  default: {},
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={qc}>
    <ReactFlowProvider>{children}</ReactFlowProvider>
  </QueryClientProvider>
);

describe('MessageNodeEditor', () => {
  it('renders MessageNodeEditor with block list and actions', () => {
    const mockEditorState: any = {
      data: { blocks: [] },
      isUploading: false,
      fileInputRef: { current: null },
      handleChange: vi.fn(),
      handleAddButton: vi.fn(),
      handleOpenEditButton: vi.fn(),
      handleFileUpload: vi.fn(),
      uploadingBlockId: null,
      setUploadingBlockId: vi.fn(),
      uploadAccept: '',
      setUploadAccept: vi.fn(),
      setIsNextStepDrawerOpen: vi.fn(),
      setNextStepSourceHandle: vi.fn(),
      isNextStepDrawerOpen: false,
      nextStepSourceHandle: null,
      handleOpenNextStepDrawer: vi.fn(),
      handleUnlinkConnection: vi.fn(),
      handleAddAndConnectNode: vi.fn(),
      isEditButtonDrawerOpen: false,
      editingButton: null,
      handleCloseEditButton: vi.fn(),
      handleSaveButton: vi.fn(),
      handleRemoveButton: vi.fn(),
      isEditDataCollectionDrawerOpen: false,
      editingDataCollectionBlock: null,
      handleOpenEditDataCollection: vi.fn(),
      handleCloseEditDataCollection: vi.fn(),
      handleSaveDataCollection: vi.fn(),
      handleRemoveDataCollection: vi.fn(),
    };

    render(
      <MessageNodeEditor
        nodeId="node_1"
        editorState={mockEditorState}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('flow_builder.text_block')).toBeInTheDocument();
  });
});
