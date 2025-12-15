import { useEffect, useRef } from 'react';

export function useHorizontalScroll(speed = 1) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;

      let target = e.target as HTMLElement;
      let isVerticallyScrollable = false;

      while (target && target !== el) {
        if (target.scrollHeight > target.clientHeight) {
          const style = window.getComputedStyle(target);
          const overflowY = style.overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') {
            const canScrollDown = target.scrollTop + target.clientHeight < target.scrollHeight;
            const canScrollUp = target.scrollTop > 0;

            if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
              isVerticallyScrollable = true;
              break;
            }
          }
        }
        target = target.parentElement as HTMLElement;
      }

      if (!isVerticallyScrollable) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * speed;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [speed]);

  return elRef;
}
