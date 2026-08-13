import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedCallback<T extends (...args: never[]) => unknown>(
  callback: T,
  delay: number
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
