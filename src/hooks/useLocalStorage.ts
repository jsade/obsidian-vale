import * as React from "react";

/**
 * useLocalStorage - Persist state to localStorage with React sync
 *
 * A type-safe hook for storing and retrieving values from localStorage.
 * Syncs state across component re-renders and handles JSON serialization.
 *
 * **Key features:**
 * - Type-safe with generics
 * - Handles JSON serialization/deserialization
 * - Falls back to default value on parse errors
 * - SSR-safe (handles missing window/localStorage)
 * - Sync updates across tabs (via storage event)
 *
 * **Usage patterns:**
 * - Persist user preferences (advanced mode, collapsed sections)
 * - Remember UI state across sessions
 * - Cache non-sensitive data
 *
 * Nielsen Heuristic Alignment:
 * - H3 (User Control): Users' preferences are remembered
 * - H7 (Flexibility): Power users can toggle advanced features
 *
 * @param key - The localStorage key (prefixed with 'vale-' automatically)
 * @param defaultValue - Value to use when key doesn't exist or on parse error
 * @returns Tuple of [value, setValue] similar to useState
 *
 * @example
 * ```tsx
 * // Boolean preference
 * const [showAdvanced, setShowAdvanced] = useLocalStorage("show-advanced", false);
 *
 * // Object preference
 * const [prefs, setPrefs] = useLocalStorage("prefs", { compact: true });
 *
 * // Array preference
 * const [collapsed, setCollapsed] = useLocalStorage<string[]>("collapsed", []);
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Prefix key to avoid collisions with other plugins
  const prefixedKey = `vale-${key}`;

  // Ref to track current value for stale closure prevention
  const valueRef = React.useRef<T | null>(null);

  // Ref to track defaultValue for storage event handling
  const defaultValueRef = React.useRef(defaultValue);
  defaultValueRef.current = defaultValue;

  /**
   * Initialize state from localStorage or default value.
   * Uses lazy initialization to avoid reading localStorage on every render.
   */
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined" || !window.localStorage) {
        valueRef.current = defaultValue;
        return defaultValue;
      }

      const item = window.localStorage.getItem(prefixedKey);
      if (item === null) {
        valueRef.current = defaultValue;
        return defaultValue;
      }

      // Parse the stored JSON value
      const parsed = JSON.parse(item) as T;
      valueRef.current = parsed;
      return parsed;
    } catch (error) {
      // On any error (parse error, security error, etc.), return default
      console.warn(
        `useLocalStorage: Error reading key "${prefixedKey}":`,
        error,
      );
      valueRef.current = defaultValue;
      return defaultValue;
    }
  });

  // Keep ref in sync with state
  valueRef.current = storedValue;

  /**
   * Update both React state and localStorage.
   * Supports both direct values and updater functions like useState.
   * Uses ref to prevent stale closure issues with rapid successive updates.
   */
  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (value: React.SetStateAction<T>) => {
      try {
        // Handle both direct value and updater function
        // Use ref to get current value, preventing stale closure bugs
        const currentValue = valueRef.current ?? defaultValueRef.current;
        const valueToStore =
          value instanceof Function ? value(currentValue) : value;

        // Update ref immediately for rapid successive calls
        valueRef.current = valueToStore;

        // Update React state
        setStoredValue(valueToStore);

        // Update localStorage
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(
            prefixedKey,
            JSON.stringify(valueToStore),
          );
        }
      } catch (error) {
        // On any error (quota exceeded, security error, etc.), log and continue
        console.warn(
          `useLocalStorage: Error writing key "${prefixedKey}":`,
          error,
        );
      }
    },
    [prefixedKey],
  );

  /**
   * Listen for storage events from other tabs/windows.
   * Keeps state in sync if the same key is changed elsewhere.
   * Uses defaultValueRef to avoid re-running when defaultValue object reference changes.
   */
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    const handleStorageChange = (event: StorageEvent): void => {
      if (event.key !== prefixedKey) {
        return;
      }

      try {
        if (event.newValue === null) {
          // Key was removed - use ref to get current defaultValue
          const fallback = defaultValueRef.current;
          valueRef.current = fallback;
          setStoredValue(fallback);
        } else {
          // Key was updated
          const parsed = JSON.parse(event.newValue) as T;
          valueRef.current = parsed;
          setStoredValue(parsed);
        }
      } catch (error) {
        console.warn(
          `useLocalStorage: Error parsing storage event for "${prefixedKey}":`,
          error,
        );
        const fallback = defaultValueRef.current;
        valueRef.current = fallback;
        setStoredValue(fallback);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [prefixedKey]);

  return [storedValue, setValue];
}
