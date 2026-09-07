import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useClickOutside } from './useClickOutside';

describe('useClickOutside', () => {
  it('calls handler when clicking outside target element', () => {
    const handler = vi.fn();
    const div = document.createElement('div');
    document.body.appendChild(div);

    const ref = { current: div };
    renderHook(() => useClickOutside(ref, handler));

    const outsideDiv = document.createElement('div');
    document.body.appendChild(outsideDiv);

    outsideDiv.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    div.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(div);
    document.body.removeChild(outsideDiv);
  });

  it('supports multiple refs', () => {
    const handler = vi.fn();
    const div1 = document.createElement('div');
    const div2 = document.createElement('div');
    const outsideDiv = document.createElement('div');
    document.body.appendChild(div1);
    document.body.appendChild(div2);
    document.body.appendChild(outsideDiv);

    const refs = [{ current: div1 }, { current: div2 }];
    renderHook(() => useClickOutside(refs, handler));

    div1.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();

    div2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).not.toHaveBeenCalled();

    outsideDiv.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(div1);
    document.body.removeChild(div2);
    document.body.removeChild(outsideDiv);
  });
});
