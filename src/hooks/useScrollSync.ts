import { useEffect, useRef } from 'preact/hooks';

export function useScrollSync(
  leftRef: { readonly current: HTMLDivElement | null },
  rightRef: { readonly current: HTMLDivElement | null },
  syncEnabled: boolean,
): void {
  const isSyncing = useRef(false);
  const anchorRef = useRef<'left' | 'right'>('left');

  useEffect(() => {
    if (!syncEnabled) return;

    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    if (!leftEl || !rightEl) return;

    let rafId: number | null = null;

    const sync = (source: HTMLDivElement, target: HTMLDivElement, side: 'left' | 'right') => {
      if (isSyncing.current) return;

      anchorRef.current = side;
      isSyncing.current = true;

      if (rafId !== null) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        target.scrollTop = source.scrollTop;
        requestAnimationFrame(() => { isSyncing.current = false; });
      });
    };

    const onLeftScroll = () => sync(leftEl, rightEl, 'left');
    const onRightScroll = () => sync(rightEl, leftEl, 'right');

    const timer = setTimeout(() => {
      leftEl.addEventListener('scroll', onLeftScroll, { passive: true });
      rightEl.addEventListener('scroll', onRightScroll, { passive: true });
    }, 100);

    return () => {
      clearTimeout(timer);
      leftEl.removeEventListener('scroll', onLeftScroll);
      rightEl.removeEventListener('scroll', onRightScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [syncEnabled]);
}
