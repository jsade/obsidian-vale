/**
 * Debounce utilities for React and non-React contexts.
 *
 * This module provides debouncing functionality to limit the rate at which
 * functions are called or values are updated. Useful for performance optimization
 * in scenarios like search inputs, API calls, and validation.
 */

import * as React from "react";

/**
 * React hook for debounced values.
 *
 * Returns a debounced version of the input value that only updates after the
 * specified delay has elapsed without the value changing. Useful for delaying
 * expensive operations like API calls or validation until the user stops typing.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 *
 * @example
 * ```typescript
 * function SearchInput() {
 *   const [searchTerm, setSearchTerm] = useState("");
 *   const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 *   useEffect(() => {
 *     if (debouncedSearchTerm) {
 *       // This only runs 500ms after the user stops typing
 *       performSearch(debouncedSearchTerm);
 *     }
 *   }, [debouncedSearchTerm]);
 *
 *   return <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />;
 * }
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    // Set up the timeout to update the debounced value after the delay
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: Clear the timeout if value changes before delay expires
    // or if the component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook for debounced callbacks.
 *
 * Returns a memoized debounced version of the callback that only executes after
 * the specified delay has elapsed since the last invocation. The debounced function
 * maintains the same type signature as the original callback.
 *
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced version of the callback
 *
 * @example
 * ```typescript
 * function PathInput({ onValidate }: Props) {
 *   const [path, setPath] = useState("");
 *
 *   const debouncedValidate = useDebouncedCallback((path: string) => {
 *     onValidate(path);
 *   }, 500);
 *
 *   const handleChange = (value: string) => {
 *     setPath(value);
 *     debouncedValidate(value); // Only calls onValidate after 500ms of inactivity
 *   };
 *
 *   return <input value={path} onChange={e => handleChange(e.target.value)} />;
 * }
 * ```
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
): T {
  // Ref to store the timeout ID
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to store the latest callback (ensures we always call the latest version)
  const callbackRef = React.useRef<T>(callback);

  // Update callback ref when callback changes
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup: Clear timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Create the debounced function
  const debouncedCallback = React.useCallback(
    (...args: Parameters<T>) => {
      // Clear any existing timeout
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      // Set up new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    },
    [delay],
  ) as T;

  return debouncedCallback;
}

/**
 * Standalone debounce function (non-React).
 *
 * Creates a debounced version of a function that delays execution until after
 * the specified delay has elapsed since the last invocation. The returned function
 * includes a `cancel` method to abort pending executions.
 *
 * This is a vanilla JavaScript implementation for use outside of React components,
 * such as in utility modules or class methods.
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with cancel method
 *
 * @example
 * ```typescript
 * class DataManager {
 *   private saveDebounced = debounce((data: Data) => {
 *     this.saveToServer(data);
 *   }, 1000);
 *
 *   updateData(data: Data) {
 *     this.saveDebounced(data); // Saves 1000ms after last update
 *   }
 *
 *   cleanup() {
 *     this.saveDebounced.cancel(); // Cancel pending save
 *   }
 * }
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  // The debounced function
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounced = function (this: any, ...args: Parameters<T>) {
    // Clear any existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set up new timeout
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  } as T & { cancel: () => void };

  // Add cancel method to allow manual cancellation
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
