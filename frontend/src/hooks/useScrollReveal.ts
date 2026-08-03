import { useEffect } from 'react';

export function useScrollReveal(dependencyKey?: any) {
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.08,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const elements = document.querySelectorAll(
      '.reveal-on-scroll, .reveal-slide-left, .reveal-slide-right, .reveal-scale, .reveal-brutal-pop, .reveal-blur-in, .reveal-scale-rotate, .reveal-flip-up'
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [dependencyKey]);
}
