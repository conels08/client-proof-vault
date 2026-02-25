'use client';

import { Children, ElementType, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delayMs?: number;
  staggerChildren?: boolean;
  staggerMs?: number;
  noScale?: boolean;
  initialTranslateClass?: string;
  mobileAnimateOnMount?: boolean;
};

export default function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  delayMs = 0,
  staggerChildren = false,
  staggerMs = 80,
  noScale = false,
  initialTranslateClass = 'translate-y-6',
  mobileAnimateOnMount = false
}: RevealProps) {
  const [revealed, setRevealed] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setRevealed(true);
      return;
    }

    if (mobileAnimateOnMount && isMobile) {
      // On mobile, avoid in-view gating for above-the-fold sections to prevent blank-on-load gaps.
      requestAnimationFrame(() => setRevealed(true));
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
        threshold: 0.06,
        rootMargin: '0px 0px -4% 0px'
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isMobile, mobileAnimateOnMount, reduceMotion]);

  const disableTransform = noScale || (mobileAnimateOnMount && isMobile);

  const baseClass = useMemo(
    () =>
      `transition-[transform,opacity,filter] duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        revealed
          ? 'translate-y-0 opacity-100 blur-0'
          : `${disableTransform ? 'translate-y-0' : initialTranslateClass} opacity-0 blur-[2px] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0 ${
              disableTransform ? '' : 'scale-[0.98] motion-reduce:scale-100'
            }`
      } ${className}`.trim(),
    [className, disableTransform, initialTranslateClass, revealed]
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
          className={`transition-[transform,opacity,filter] duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            revealed
              ? 'translate-y-0 opacity-100 blur-0'
              : `${disableTransform ? 'translate-y-0' : initialTranslateClass} opacity-0 blur-[2px] motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:blur-0 ${
                  disableTransform ? '' : 'scale-[0.98] motion-reduce:scale-100'
                }`
          }`}
          style={!reduceMotion ? ({ transitionDelay: `${delayMs + index * staggerMs}ms` } as const) : undefined}
        >
          {child}
        </div>
      ))}
    </Tag>
  );
}
