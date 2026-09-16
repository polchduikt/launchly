import { describe, it, expect, vi } from 'vitest';
import { registerAuthCleanup, runAuthCleanup } from './authCleanup';

describe('authCleanup', () => {
  it('registers and executes callbacks on cleanup', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const unregister1 = registerAuthCleanup(callback1);
    const unregister2 = registerAuthCleanup(callback2);

    runAuthCleanup();

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);

    unregister1();
    unregister2();
  });

  it('unregisters callback when returned function is called', () => {
    const callback = vi.fn();
    const unregister = registerAuthCleanup(callback);

    unregister();
    runAuthCleanup();

    expect(callback).not.toHaveBeenCalled();
  });

  it('continues executing subsequent callbacks if one throws an error', () => {
    const errorCallback = vi.fn(() => {
      throw new Error('Cleanup error');
    });
    const successCallback = vi.fn();

    const unregister1 = registerAuthCleanup(errorCallback);
    const unregister2 = registerAuthCleanup(successCallback);

    expect(() => runAuthCleanup()).not.toThrow();
    expect(errorCallback).toHaveBeenCalledTimes(1);
    expect(successCallback).toHaveBeenCalledTimes(1);

    unregister1();
    unregister2();
  });
});
