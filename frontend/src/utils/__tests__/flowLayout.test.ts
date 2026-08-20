import { describe, it, expect } from 'vitest';
import { getAutoLayoutedElements } from '../flowLayout';
import type { Node, Edge } from '@xyflow/react';

describe('flowLayout', () => {
  it('returns empty nodes and edges when empty array is provided', () => {
    const res = getAutoLayoutedElements([], []);
    expect(res.nodes).toEqual([]);
    expect(res.edges).toEqual([]);
  });

  it('calculates layout positions for connected flow nodes', () => {
    const nodes: Node[] = [
      {
        id: 'start_1',
        type: 'START',
        position: { x: 0, y: 0 },
        data: {},
      },
      {
        id: 'msg_1',
        type: 'MESSAGE',
        position: { x: 0, y: 0 },
        data: { text: 'Hello', buttons: [{ text: 'Click me', value: 'btn_1' }] },
      },
    ];

    const edges: Edge[] = [
      {
        id: 'e_1',
        source: 'start_1',
        target: 'msg_1',
      },
    ];

    const res = getAutoLayoutedElements(nodes, edges, 'LR');

    expect(res.nodes.length).toBe(2);
    expect(res.nodes[1].position.x).toBeGreaterThan(res.nodes[0].position.x);
  });
});
