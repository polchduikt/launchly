import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { StartNode } from '../StartNode';
import { EndNode } from '../EndNode';
import { CommentNode } from '../CommentNode';
import { AiNode } from '../AiNode';

describe('FlowBuilder Node Components', () => {
  it('renders StartNode with initial trigger card', () => {
    render(
      <ReactFlowProvider>
        <StartNode
          id="start-1"
          type="start"
          data={{}}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('tg')).toBeInTheDocument();
  });

  it('renders EndNode with terminal descriptions', () => {
    render(
      <ReactFlowProvider>
        <EndNode
          id="end-1"
          type="end"
          data={{}}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText(/Кінець потоку|Flow end/i)).toBeInTheDocument();
  });

  it('renders CommentNode with custom text note', () => {
    render(
      <ReactFlowProvider>
        <CommentNode
          id="comment-1"
          type="comment"
          data={{ text: 'Remember to connect Stripe checkout here' }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Remember to connect Stripe checkout here')).toBeInTheDocument();
  });

  it('renders AiNode with custom generated prompt', () => {
    render(
      <ReactFlowProvider>
        <AiNode
          id="ai-1"
          type="ai"
          data={{ generated: true, prompt: 'Recommend top 3 bestselling products' }}
          selected={false}
          zIndex={1}
          isConnectable={true}
          positionAbsoluteX={0}
          positionAbsoluteY={0}
          dragging={false}
        />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Recommend top 3 bestselling products')).toBeInTheDocument();
  });
});
