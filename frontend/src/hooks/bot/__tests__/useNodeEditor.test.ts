import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNodeEditor, getBlocks } from '../useNodeEditor';
import type { Node } from '@xyflow/react';

describe('useNodeEditor & getBlocks', () => {
  it('extracts flow blocks from node data with text and buttons', () => {
    const data = {
      text: 'Welcome to bot',
      buttons: [{ text: 'Start', value: 'start' }],
    };

    const blocks = getBlocks(data as any);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks[0].text).toBe('Welcome to bot');
  });

  it('manages node editor drawer states', () => {
    const mockNode: Node = {
      id: 'node_1',
      position: { x: 0, y: 0 },
      data: { text: 'Hello', blocks: [] },
    };
    const mockUpdate = vi.fn();
    const mockCreateStep = vi.fn();

    const { result } = renderHook(() =>
      useNodeEditor(mockNode, mockUpdate, mockCreateStep)
    );

    act(() => {
      result.current.setIsNextStepDrawerOpen(true);
      result.current.setNextStepSourceHandle('handle_1');
    });

    expect(result.current.isNextStepDrawerOpen).toBe(true);
    expect(result.current.nextStepSourceHandle).toBe('handle_1');
  });
});
