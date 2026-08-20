import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NodeEditorPanel } from '../NodeEditorPanel';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k),
  useTranslation: () => ({ t: (k: string, fb?: any) => (typeof fb === 'string' ? fb : k) }),
}));

vi.mock('../../../../../../hooks/bot/useNodeEditor', () => ({
  useNodeEditor: () => ({
    data: {},
    handleChange: vi.fn(),
  }),
}));

vi.mock('../editors/StartNodeEditor', () => ({
  StartNodeEditor: () => <div data-testid="start-editor" />,
}));
vi.mock('../editors/MessageNodeEditor', () => ({
  MessageNodeEditor: () => <div data-testid="message-editor" />,
}));
vi.mock('../editors/EndNodeEditor', () => ({
  EndNodeEditor: () => <div data-testid="end-editor" />,
}));

describe('NodeEditorPanel', () => {
  it('renders empty canvas text when no node is selected', () => {
    render(<NodeEditorPanel onUpdateNodeData={vi.fn()} />);
    expect(screen.getByText('flow_builder.empty_canvas')).toBeInTheDocument();
  });

  it('renders StartNodeEditor when node type is START', () => {
    render(
      <NodeEditorPanel
        node={{ id: '1', type: 'START', position: { x: 0, y: 0 }, data: {} }}
        onUpdateNodeData={vi.fn()}
      />
    );
    expect(screen.getByTestId('start-editor')).toBeInTheDocument();
  });

  it('renders EndNodeEditor when node type is END', () => {
    render(
      <NodeEditorPanel
        node={{ id: '2', type: 'END', position: { x: 0, y: 0 }, data: {} }}
        onUpdateNodeData={vi.fn()}
      />
    );
    expect(screen.getByTestId('end-editor')).toBeInTheDocument();
  });
});
