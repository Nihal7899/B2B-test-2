import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

interface KeepAliveRendererProps {
  currentKey: string;
  render: () => ReactNode;
  maxCache?: number;
}

interface ScrollPos {
  x: number;
  y: number;
}

export function KeepAliveRenderer({ currentKey, render, maxCache = 8 }: KeepAliveRendererProps) {
  const location = useLocation();
  const navigationType = useNavigationType();

  const frozenElements = useRef<Map<string, ReactNode>>(new Map());
  const scrollPositions = useRef<Map<string, ScrollPos>>(new Map());
  const currentElementRef = useRef<ReactNode>(null);
  const prevKeyRef = useRef(currentKey);
  const [aliveKeys, setAliveKeys] = useState<string[]>([currentKey]);

  const keyChanged = prevKeyRef.current !== currentKey;
  const isPop = navigationType === 'POP';
  const hasFrozen = frozenElements.current.has(currentKey);
  const useFrozen = isPop && hasFrozen;

  if (keyChanged) {
    scrollPositions.current.set(prevKeyRef.current, {
      x: window.scrollX,
      y: window.scrollY,
    });

    if (navigationType === 'PUSH') {
      scrollPositions.current.delete(currentKey);
      if (currentElementRef.current !== null) {
        frozenElements.current.set(prevKeyRef.current, currentElementRef.current);
      }
    }

    let newAlive = aliveKeys;
    if (!aliveKeys.includes(currentKey)) {
      newAlive = [...aliveKeys, currentKey];
    }

    while (newAlive.length > maxCache) {
      const oldest = newAlive[0];
      if (oldest === currentKey) break;
      frozenElements.current.delete(oldest);
      scrollPositions.current.delete(oldest);
      newAlive = newAlive.slice(1);
    }

    if (newAlive !== aliveKeys) {
      setAliveKeys(newAlive);
    }

    prevKeyRef.current = currentKey;
  }

  const currentElement = useFrozen
    ? (frozenElements.current.get(currentKey) ?? null)
    : render() ?? null;
  currentElementRef.current = currentElement;

  useLayoutEffect(() => {
    const saved = scrollPositions.current.get(currentKey);
    if (saved) {
      window.scrollTo(saved.x, saved.y);
    } else {
      window.scrollTo(0, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, location.key]);

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
