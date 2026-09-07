import { useEffect, type RefObject } from 'react';

type TargetRef = RefObject<HTMLElement | null> | Array<RefObject<HTMLElement | null>>;

export const useClickOutside = (
  target: TargetRef,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
): void => {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const targetElement = event.target as Node | null;
      if (!targetElement) return;

      const refs = Array.isArray(target) ? target : [target];
      const isInside = refs.some((ref) => ref.current && ref.current.contains(targetElement));

      if (!isInside) {
        handler(event);
      }
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [target, handler, enabled]);
};
