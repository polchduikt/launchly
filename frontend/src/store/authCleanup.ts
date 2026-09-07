type CleanupFn = () => void;

const cleanupCallbacks = new Set<CleanupFn>();

export const registerAuthCleanup = (fn: CleanupFn): (() => void) => {
  cleanupCallbacks.add(fn);
  return () => {
    cleanupCallbacks.delete(fn);
  };
};

export const runAuthCleanup = (): void => {
  cleanupCallbacks.forEach((fn) => {
    try {
      fn();
    } catch (error) {
      console.error('Error during auth cleanup:', error);
    }
  });
};
