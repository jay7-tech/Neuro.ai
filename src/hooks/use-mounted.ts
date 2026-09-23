'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `compute()` only after hydration. Use for values that differ between the
 * server and the browser (local time, browser-only APIs) to avoid hydration mismatches.
 */
export function useClientValue<T>(compute: () => T): T | null {
  const [value, setValue] = useState<T | null>(null);
  useEffect(() => {
    const v = compute();
    setValue(() => v); // wrapped: a function value would otherwise be treated as an updater
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
