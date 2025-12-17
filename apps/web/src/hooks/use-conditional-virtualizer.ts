import { useVirtualizer } from '@tanstack/react-virtual';
import { type RefObject } from 'react';

interface UseConditionalVirtualizerOptions {
  count: number;
  parentRef: RefObject<HTMLElement>;
  estimateSize?: (index: number) => number;
  overscan?: number;
  enabled?: boolean;
}

const VIRTUALIZATION_THRESHOLD = 20;
const DEFAULT_OVERSCAN = 7;
const DEFAULT_ITEM_SIZE = 200;

/**
 * Hook que retorna um virtualizer apenas se o número de itens ultrapassar o threshold.
 * Para arrays menores, retorna null indicando que a renderização normal deve ser usada.
 */
export function useConditionalVirtualizer({
  count,
  parentRef,
  estimateSize = () => DEFAULT_ITEM_SIZE,
  overscan = DEFAULT_OVERSCAN,
  enabled = true,
}: UseConditionalVirtualizerOptions) {
  const shouldVirtualize = enabled && count >= VIRTUALIZATION_THRESHOLD;

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
    enabled: shouldVirtualize,
  });

  return shouldVirtualize ? virtualizer : null;
}
