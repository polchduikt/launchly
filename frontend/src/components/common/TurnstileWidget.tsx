import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface TurnstileWidgetRef {
  reset: () => void;
}

interface TurnstileOptions {
  sitekey: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  callback?: (token: string) => void;
  'error-callback'?: (error?: unknown) => void;
  'expired-callback'?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement | string, options: TurnstileOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: unknown) => void;
}

const SITE_KEY = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY;

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  (
    {
      siteKey = SITE_KEY,
      theme = 'light',
      size = 'flexible',
      className = '',
      onVerify,
      onExpire,
      onError,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    const onErrorRef = useRef(onError);

    useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
      onErrorRef.current = onError;
    });

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch (err) {
            console.error('Failed to reset Turnstile widget:', err);
          }
        }
      },
    }));

    useEffect(() => {
      let isMounted = true;
      let intervalId: ReturnType<typeof setInterval> | null = null;

      if (!siteKey) {
        console.warn('TurnstileWidget: VITE_CLOUDFLARE_TURNSTILE_SITE_KEY is not defined');
        return;
      }

      const doRender = () => {
        if (!isMounted || !containerRef.current || !window.turnstile?.render) return;
        if (widgetIdRef.current) return;

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: (token: string) => {
              if (isMounted) {
                onVerifyRef.current(token);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                onExpireRef.current?.();
              }
            },
            'error-callback': (err: unknown) => {
              if (isMounted) {
                onErrorRef.current?.(err);
              }
            },
          });
          widgetIdRef.current = id;
        } catch (err) {
          console.error('Failed to render Turnstile widget:', err);
        }
      };

      if (window.turnstile?.render) {
        doRender();
      } else {
        let attempts = 0;
        intervalId = setInterval(() => {
          attempts++;
          if (window.turnstile?.render) {
            if (intervalId) clearInterval(intervalId);
            doRender();
          } else if (attempts > 60) {
            if (intervalId) clearInterval(intervalId);
          }
        }, 50);
      }

      return () => {
        isMounted = false;
        if (intervalId) clearInterval(intervalId);
        if (window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (err) {
            console.error('Failed to remove Turnstile widget:', err);
          }
          widgetIdRef.current = null;
        }
      };
    }, [siteKey, theme, size]);

    return (
      <div className={`w-full flex justify-center items-center min-h-[65px] my-1 ${className}`}>
        <div ref={containerRef} className="w-full flex justify-center [&>iframe]:!w-full [&>iframe]:!max-w-full" />
      </div>
    );
  }
);

TurnstileWidget.displayName = 'TurnstileWidget';
