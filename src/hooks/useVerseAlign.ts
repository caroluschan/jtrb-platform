import { useEffect, useRef, useCallback } from 'preact/hooks';
import type { RefObject } from 'preact';

interface UseVerseAlignOptions {
  leftRef: RefObject<HTMLDivElement>;
  rightRef: RefObject<HTMLDivElement>;
  enabled: boolean;
  versesKey: unknown;
  fontSizeKey: unknown;
}

export function useVerseAlign({ leftRef, rightRef, enabled, versesKey, fontSizeKey }: UseVerseAlignOptions): void {
  const alignScheduled = useRef(false);

  const align = useCallback(() => {
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    if (!leftEl || !rightEl) return;

    const leftVerses = leftEl.querySelectorAll<HTMLElement>('.verse[data-verse]');
    const rightVerses = rightEl.querySelectorAll<HTMLElement>('.verse[data-verse]');
    if (leftVerses.length === 0 || rightVerses.length === 0) return;

    alignVerses(leftVerses, rightVerses);
  }, []);

  useEffect(() => {
    if (!enabled) {
      clearAll(leftRef.current, rightRef.current);
      return;
    }

    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    if (!leftEl || !rightEl) return;

    const scheduleAlign = () => {
      if (alignScheduled.current) return;
      alignScheduled.current = true;
      requestAnimationFrame(() => {
        align();
        alignScheduled.current = false;
      });
    };

    scheduleAlign();

    const ro = new ResizeObserver(() => {
      scheduleAlign();
    });
    ro.observe(leftEl);
    ro.observe(rightEl);

    const onResize = () => scheduleAlign();
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      clearAll(leftEl, rightEl);
    };
  }, [enabled, versesKey, fontSizeKey, align]);
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
