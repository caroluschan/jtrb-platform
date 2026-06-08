import { useEffect, useRef } from 'preact/hooks';

export function useScrollSync(
  leftRef: { readonly current: HTMLDivElement | null },
  rightRef: { readonly current: HTMLDivElement | null },
  ready: boolean,
): void {
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!ready) return;

    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    if (!leftEl || !rightEl) return;

    let rafId: number | null = null;

    const scrollHandler = (source: HTMLDivElement, target: HTMLDivElement) => {
      if (isSyncing.current) return;
      isSyncing.current = true;

      // Cancel pending RAF
      if (rafId !== null) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        // Calculate scroll percentage of source
        const maxScroll = source.scrollHeight - source.clientHeight;
        if (maxScroll <= 0) {
          isSyncing.current = false;
          return;
        }
        const scrollPercent = source.scrollTop / maxScroll;

        // Apply same percentage to target
        const targetMax = target.scrollHeight - target.clientHeight;
        target.scrollTop = scrollPercent * targetMax;

        isSyncing.current = false;
      });
    };

    const onLeftScroll = () => scrollHandler(leftEl, rightEl);
    const onRightScroll = () => scrollHandler(rightEl, leftEl);

    leftEl.addEventListener('scroll', onLeftScroll, { passive: true });
    rightEl.addEventListener('scroll', onRightScroll, { passive: true });

    return () => {
      leftEl.removeEventListener('scroll', onLeftScroll);
      rightEl.removeEventListener('scroll', onRightScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [ready]);
}
