import { DestroyRef, ElementRef, WritableSignal } from '@angular/core';

/**
 * Distributes items round-robin across N columns, where N is derived from the
 * container width and a target column width. Avoids CSS multi-column layout,
 * which places items column-major (breaking chronological order) and can
 * split a tall item across two columns via the column balancer.
 */
export function distributeRoundRobin<T>(items: readonly T[], columnCount: number): T[][] {
  const columns: T[][] = Array.from({ length: Math.max(1, columnCount) }, () => []);
  items.forEach((item, index) => {
    columns[index % columns.length].push(item);
  });
  return columns;
}

/**
 * Keeps `columnCount` in sync with how many `columnWidth`-wide columns fit in
 * `container`, updating on resize. Used to drive a round-robin masonry layout.
 * Returns a cleanup function that disconnects the observer - callers whose
 * container can be torn down and recreated (e.g. behind an `@if`) must call it
 * before re-invoking with a new container, so a stale observer never lingers.
 */
export function watchColumnCount(
  container: ElementRef<HTMLElement>,
  columnCount: WritableSignal<number>,
  destroyRef: DestroyRef,
  columnWidth: number,
  gap: number,
): () => void {
  const element = container.nativeElement;
  const compute = (width: number) => Math.max(1, Math.floor((width + gap) / (columnWidth + gap)));

  columnCount.set(compute(element.clientWidth));

  const observer = new ResizeObserver(([entry]) => {
    columnCount.set(compute(entry.contentRect.width));
  });
  observer.observe(element);
  const cleanup = () => observer.disconnect();
  destroyRef.onDestroy(cleanup);
  return cleanup;
}
