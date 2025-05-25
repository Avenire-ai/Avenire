import { useEffect, useRef, type RefObject } from 'react';

export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T | null>,
  RefObject<T | null>,
  () => void
] {
  const containerRef = useRef<T>(null);
  const endRef = useRef<T>(null);

  const scroll = () => {
    const container = containerRef.current;
    const end = endRef.current;

    if (container && end) {
      end.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  return [containerRef, endRef, scroll];
}