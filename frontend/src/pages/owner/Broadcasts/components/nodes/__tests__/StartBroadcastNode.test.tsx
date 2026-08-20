import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { StartBroadcastNode } from '../StartBroadcastNode';

vi.mock('../../../../../../i18n/config', () => ({
  t: (k: string) => k,
  useTranslation: () => ({ t: (k: string, fb?: string) => fb || k }),
}));

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    useConnection: () => ({ inProgress: false }),
    useNodeConnections: () => [],
    Handle: ({ type }: any) => <div data-testid={`handle-${type}`} />,
  };
});

describe('StartBroadcastNode', () => {
  it('renders correctly', () => {
    render(
      <ReactFlowProvider>
        <StartBroadcastNode />
      </ReactFlowProvider>
    );
    expect(screen.getByText('broadcast.builder.node.when')).toBeInTheDocument();
    expect(screen.getByText('broadcast.builder.node.you_send_broadcast')).toBeInTheDocument();
  });
});
