import React, { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: string;
  duration?: number;
  className?: string;
}

function parseStringValue(str: string) {
  const match = str.match(/([^\d]*)([\d\s,]+)(.*)/);
  if (!match) {
    return { prefix: '', targetNum: 0, separator: '', suffix: str };
  }
  const prefix = match[1] || '';
  const numStrRaw = match[2] || '0';
  const suffix = match[3] || '';

  let separator = '';
  if (numStrRaw.includes(',')) separator = ',';
  else if (numStrRaw.includes(' ')) separator = ' ';

  const targetNum = parseInt(numStrRaw.replace(/[\s,]/g, ''), 10) || 0;

  return { prefix, targetNum, separator, suffix };
}

function formatValue(currentNum: number, originalStr: string): string {
  const { prefix, separator, suffix } = parseStringValue(originalStr);
  
  let formattedNum = currentNum.toString();
  if (separator) {
    formattedNum = currentNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  }
  
  return `${prefix}${formattedNum}${suffix}`;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 1800,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(() => formatValue(0, value));
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const { targetNum } = parseStringValue(value);
    if (targetNum === 0) {
      setDisplayValue(value);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentNum = Math.floor(easeProgress * targetNum);

      setDisplayValue(formatValue(currentNum, value));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible, value, duration]);

  return (
    <span ref={containerRef} className={className}>
      {displayValue}
    </span>
  );
};
