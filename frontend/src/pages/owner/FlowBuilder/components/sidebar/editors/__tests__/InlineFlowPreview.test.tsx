import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { InlineFlowPreview } from '../InlineFlowPreview';

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

describe('InlineFlowPreview', () => {
  it('renders inline flow preview container', () => {
    const { container } = render(
      <InlineFlowPreview
        nodes={[
          {
            id: 'node_1',
            type: 'START',
            position: { x: 0, y: 0 },
            data: {},
          },
        ]}
        edges={[]}
      />
    );
    expect(container).toBeDefined();
  });
});
