'use client';

import { Children, ElementType, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delayMs?: number;
  staggerChildren?: boolean;
  staggerMs?: number;
};

export default function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  delayMs = 0,
  staggerChildren = false,
  staggerMs = 60
}: RevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setRevealed(true);
      return;
    }

    if (!ref.current || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const baseClass = useMemo(
    () =>
      `transition-transform transition-opacity duration-700 ease-out motion-reduce:transition-none ${
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
      } ${className}`.trim(),
    [className, revealed]
  );

  const wrapperStyle = !reduceMotion && delayMs > 0 ? ({ transitionDelay: `${delayMs}ms` } as const) : undefined;

  if (!staggerChildren) {
    return (
      <Tag ref={ref} className={baseClass} style={wrapperStyle}>
        {children}
      </Tag>
    );
  }

  const childNodes = Children.toArray(children);

  return (
    <Tag ref={ref} className={className}>
      {childNodes.map((child, index) => (
        <div
          key={index}
          className={`transition-transform transition-opacity duration-700 ease-out motion-reduce:transition-none ${
            revealed ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100'
          }`}
          style={!reduceMotion ? ({ transitionDelay: `${delayMs + index * staggerMs}ms` } as const) : undefined}
        >
          {child}
        </div>
      ))}
    </Tag>
  );
}
