import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { StartAutomationBroadcastNode } from './StartAutomationBroadcastNode';

vi.mock('../../../../../hooks/bot/useNodeHover', () => ({
  useNodeHover: () => ({ showToolbar: false, bindHover: {} })
}));

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    useConnection: () => ({ inProgress: false, fromNode: null }),
    Handle: ({ type }: { type?: string }) => <div data-testid={`handle-${type}`} />,
  };
});

describe('StartAutomationBroadcastNode', () => {
  it('renders correctly with no automation selected', () => {
    const onSelectClick = vi.fn();
    render(
      <ReactFlowProvider>
        <StartAutomationBroadcastNode id="1" data={{ onSelectClick }} />
      </ReactFlowProvider>
    );
    expect(screen.getByText('Start Automation')).toBeInTheDocument();
    const btn = screen.getByText('Click to Select Automation');
    fireEvent.click(btn);
    expect(onSelectClick).toHaveBeenCalled();
  });

  it('renders correctly with selected automation', () => {
    render(
      <ReactFlowProvider>
        <StartAutomationBroadcastNode id="1" data={{ automationName: 'Test Automation' }} />
      </ReactFlowProvider>
    );
    expect(screen.getByText('Test Automation')).toBeInTheDocument();
  });
});
