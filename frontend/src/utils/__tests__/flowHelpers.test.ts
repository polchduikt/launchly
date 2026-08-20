import { describe, it, expect } from 'vitest';
import { getFlowKey, getFlowLogicKey } from '../flowHelpers';
import type { Node, Edge } from '@xyflow/react';

describe('Flow Helpers', () => {
  const sampleNodes: Node[] = [
    {
      id: 'start-1',
      type: 'START',
      position: { x: 100.4, y: 200.2 },
      data: { label: 'Start' },
    },
    {
      id: 'msg-1',
      type: 'MESSAGE',
      position: { x: 300, y: 200 },
      data: { text: 'Hello world' },
    },
  ];

  const sampleEdges: Edge[] = [
    {
      id: 'e1-2',
      source: 'start-1',
      target: 'msg-1',
      sourceHandle: 'next',
      targetHandle: 'input',
    },
  ];

  it('generates consistent flow key rounding coordinates', () => {
    const key1 = getFlowKey(sampleNodes, sampleEdges);
    const key2 = getFlowKey(
      [
        {
          id: 'start-1',
          type: 'START',
          position: { x: 100.1, y: 200.4 },
          data: { label: 'Start' },
        },
        sampleNodes[1],
      ],
      sampleEdges
    );

    expect(key1).toBe(key2);
  });

  it('computes reachable logical flow key', () => {
    const logicKey = getFlowLogicKey(sampleNodes, sampleEdges);
    expect(logicKey).toContain('start-1');
    expect(logicKey).toContain('msg-1');
  });

  it('returns empty string when nodes array is empty', () => {
    expect(getFlowLogicKey([], [])).toBe('');
  });
});
