// src/components/KeepAliveRenderer.tsx
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigationType } from 'react-router-dom';

interface KeepAliveRendererProps {
  currentKey: string;
  render: () => ReactNode;
  maxCache?: number;
  excludeKeys?: string[];
}

interface ScrollPos {
  x: number;
  y: number;
}

export function KeepAliveRenderer({
  currentKey,
  render,
  maxCache = 8,
  excludeKeys = [],
}: KeepAliveRendererProps) {
  const navigationType = useNavigationType();

  const frozenElements = useRef<Map<string, ReactNode>>(new Map());
  const scrollPositions = useRef<Map<string, ScrollPos>>(new Map());
  const currentElementRef = useRef<ReactNode>(null);
  const prevKeyRef = useRef(currentKey);
  const [aliveKeys, setAliveKeys] = useState<string[]>([currentKey]);
  
  // 1. ADD THIS REF to track the initial app boot
  const isInitialMount = useRef(true);

  const keyChanged = prevKeyRef.current !== currentKey;
  const isExcluded = excludeKeys.includes(currentKey);
  const wasExcluded = excludeKeys.includes(prevKeyRef.current);

  if (keyChanged) {
    if (!wasExcluded) {
      scrollPositions.current.set(prevKeyRef.current, {
        x: window.scrollX,
        y: window.scrollY,
      });

      if (navigationType === 'PUSH' && currentElementRef.current !== null) {
        frozenElements.current.set(prevKeyRef.current, currentElementRef.current);
      }
    } else {
      frozenElements.current.delete(prevKeyRef.current);
      scrollPositions.current.delete(prevKeyRef.current);
    }

    let newAlive = aliveKeys.filter((k) => k === currentKey || !excludeKeys.includes(k));
    if (!newAlive.includes(currentKey)) {
      newAlive = [...newAlive, currentKey];
    }

    while (newAlive.length > maxCache) {
      const oldest = newAlive[0];
      if (oldest === currentKey) break;
      frozenElements.current.delete(oldest);
      scrollPositions.current.delete(oldest);
      newAlive = newAlive.slice(1);
    }

    if (newAlive.length !== aliveKeys.length || newAlive.some((k, i) => k !== aliveKeys[i])) {
      setAliveKeys(newAlive);
    }

    prevKeyRef.current = currentKey;
  }

  const currentElement = render() ?? null;
  currentElementRef.current = currentElement;

  // 2. UPDATE THIS EFFECT to prevent the scroll collision
  useLayoutEffect(() => {
    // Prevent the browser from fighting our scroll logic
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const saved = scrollPositions.current.get(currentKey);
    if (saved) {
      // Restore position instantly if it exists
      window.scrollTo(saved.x, saved.y);
    } else if (!isInitialMount.current) {
      // ONLY force scroll to top on NEW page navigations.
      // Doing this on the initial boot fights the user's touch and causes screen tearing.
      window.scrollTo(0, 0);
    }

    // Mark the initial boot as complete
    isInitialMount.current = false;

    window.dispatchEvent(new CustomEvent('keepalive:activated', { detail: { key: currentKey } }));
  }, [currentKey]);

  return (
    <>
      {aliveKeys.map((key) => {
        if (key === currentKey) {
          return (
            <div key={key} style={{ display: 'block' }}>
              {currentElement}
            </div>
          );
        }
        const frozen = frozenElements.current.get(key);
        if (frozen === null || frozen === undefined) return null;
        return (
          <div key={key} style={{ display: 'none' }} aria-hidden="true">
            {frozen}
          </div>
        );
      })}
    </>
  );
}
