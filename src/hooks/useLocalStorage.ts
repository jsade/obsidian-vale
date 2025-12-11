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

  /**
   * Initialize state from localStorage or default value.
   * Uses lazy initialization to avoid reading localStorage on every render.
   */
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    try {
      // Check if we're in a browser environment
      if (typeof window === "undefined" || !window.localStorage) {
        return defaultValue;
      }

      const item = window.localStorage.getItem(prefixedKey);
      if (item === null) {
        return defaultValue;
      }

      // Parse the stored JSON value
      return JSON.parse(item) as T;
    } catch (error) {
      // On any error (parse error, security error, etc.), return default
      console.warn(
        `useLocalStorage: Error reading key "${prefixedKey}":`,
        error,
      );
      return defaultValue;
    }
  });

  /**
   * Update both React state and localStorage.
   * Supports both direct values and updater functions like useState.
   */
  const setValue: React.Dispatch<React.SetStateAction<T>> = React.useCallback(
    (value: React.SetStateAction<T>) => {
      try {
        // Handle both direct value and updater function
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

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
    [prefixedKey, storedValue],
  );

  /**
   * Listen for storage events from other tabs/windows.
   * Keeps state in sync if the same key is changed elsewhere.
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
          // Key was removed
          setStoredValue(defaultValue);
        } else {
          // Key was updated
          setStoredValue(JSON.parse(event.newValue) as T);
        }
      } catch (error) {
        console.warn(
          `useLocalStorage: Error parsing storage event for "${prefixedKey}":`,
          error,
        );
        setStoredValue(defaultValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [prefixedKey, defaultValue]);

  return [storedValue, setValue];
}
