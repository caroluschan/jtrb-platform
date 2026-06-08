import { useEffect, useRef } from 'preact/hooks';
import type { RefObject } from 'preact';

interface UseVerseAlignOptions {
  leftRef: RefObject<HTMLDivElement>;
  rightRef: RefObject<HTMLDivElement>;
  enabled: boolean;
  versesKey: unknown;
  fontSizeKey: unknown;
}

export function useVerseAlign({ leftRef, rightRef, enabled, versesKey, fontSizeKey }: UseVerseAlignOptions): void {
  const rafId = useRef<number | null>(null);
  const timerId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      clearAll(leftRef.current, rightRef.current);
      return;
    }

    const tryAlign = () => {
      const leftEl = leftRef.current;
      const rightEl = rightRef.current;

      if (!leftEl || !rightEl) {
        rafId.current = requestAnimationFrame(tryAlign);
        return;
      }

      const leftVerses = leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]');
      const rightVerses = rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]');

      if (leftVerses.length === 0 || rightVerses.length === 0) {
        rafId.current = requestAnimationFrame(tryAlign);
        return;
      }

      alignVerses(leftVerses, rightVerses);
      rafId.current = requestAnimationFrame(tryAlign);
      // timerId.current = window.setTimeout(() => {
      //   rafId.current = requestAnimationFrame(tryAlign);
      // }, 1);
    };

    rafId.current = requestAnimationFrame(tryAlign);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (timerId.current !== null) {
        clearTimeout(timerId.current);
        timerId.current = null;
      }
    };
  }, [enabled, versesKey, fontSizeKey]);
}

function clearAll(leftEl: HTMLDivElement | null, rightEl: HTMLDivElement | null): void {
  if (!leftEl || !rightEl) return;
  leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]').forEach(el => { el.style.minHeight = ''; });
  rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]').forEach(el => { el.style.minHeight = ''; });
}

function alignVerses(
  leftVerses: NodeListOf<HTMLElement>,
  rightVerses: NodeListOf<HTMLElement>,
): void {
  const rightMap = new Map<number, HTMLElement>();
  rightVerses.forEach(el => {
    const v = el.getAttribute('data-verse');
    if (v) rightMap.set(Number(v), el);
  });

  leftVerses.forEach(leftEl => {
    const v = leftEl.getAttribute('data-verse');
    if (!v) return;
    const rightEl = rightMap.get(Number(v));
    if (!rightEl) return;

    leftEl.style.minHeight = '';
    rightEl.style.minHeight = '';

    const maxH = Math.max(leftEl.offsetHeight, rightEl.offsetHeight);

    leftEl.style.minHeight = `${maxH}px`;
    rightEl.style.minHeight = `${maxH}px`;
  });
}
