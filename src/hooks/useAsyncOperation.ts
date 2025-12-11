import * as React from "react";

/**
 * State for an async operation.
 * Tracks loading, error, success states and the result data.
 */
export interface AsyncOperationState<T> {
  /** Whether the operation is currently in progress */
  isLoading: boolean;
  /** Error that occurred during the operation, if any */
  error: Error | null;
  /** Result data from the operation, if successful */
  data: T | null;
  /** Whether the operation has completed successfully */
  isSuccess: boolean;
  /** Whether the operation has failed */
  isError: boolean;
  /** Execute the async operation */
  execute: () => Promise<void>;
  /** Reset the state to initial values */
  reset: () => void;
}

/**
 * Custom hook for managing async operation state.
 *
 * Features:
 * - Tracks loading, error, success states
 * - Proper cleanup with AbortController
 * - Prevents state updates after unmount
 * - Provides execute and reset methods
 *
 * @param operation - Async operation to execute
 * @returns State and control methods for the async operation
 *
 * @example
 * ```tsx
 * const installVale = useAsyncOperation(async () => {
 *   if (!configManager) throw new Error("Config manager not available");
 *   await configManager.installVale();
 * });
 *
 * // In component:
 * <button
 *   onClick={installVale.execute}
 *   disabled={installVale.isLoading}
 * >
 *   {installVale.isLoading ? "Installing..." : "Install Vale"}
 * </button>
 *
 * {installVale.isError && <div>Error: {installVale.error?.message}</div>}
 * {installVale.isSuccess && <div>Installation complete!</div>}
 * ```
 *
 * @example
 * ```tsx
 * const fetchStyles = useAsyncOperation(async () => {
 *   if (!configManager) throw new Error("Config manager not available");
 *   return await configManager.getAvailableStyles();
 * });
 *
 * React.useEffect(() => {
 *   void fetchStyles.execute();
 * }, []);
 *
 * if (fetchStyles.isLoading) return <div>Loading...</div>;
 * if (fetchStyles.isError) return <div>Error: {fetchStyles.error?.message}</div>;
 * if (fetchStyles.data) {
 *   // Render styles: fetchStyles.data
 * }
 * ```
 */
export function useAsyncOperation<T = void>(
  operation: (signal: AbortSignal) => Promise<T>,
): AsyncOperationState<T> {
  // State: Track loading status
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // State: Track error
  const [error, setError] = React.useState<Error | null>(null);

  // State: Track result data
  const [data, setData] = React.useState<T | null>(null);

  // Ref: Track if component is mounted
  const isMountedRef = React.useRef<boolean>(true);

  // Ref: AbortController for cancelling in-flight operations
  const abortControllerRef = React.useRef<AbortController | null>(null);

  /**
   * Cleanup: Set mounted flag and abort controller on unmount.
   */
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Execute the async operation.
   * Handles loading state, error handling, and cleanup.
   */
  const execute = React.useCallback(async (): Promise<void> => {
    // Abort any in-flight operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this execution
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Reset error state and set loading
    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      // Execute the operation with abort signal
      const result = await operation(abortController.signal);

      // Check if aborted before updating state
      if (abortController.signal.aborted) {
        return;
      }

      // Update state with result if still mounted
      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
      }
    } catch (err) {
      // Check if aborted before updating state
      if (abortController.signal.aborted) {
        return;
      }

      // Handle error if still mounted
      if (isMountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setIsLoading(false);
      }
    }
  }, [operation]);

  /**
   * Reset the state to initial values.
   * Aborts any in-flight operation.
   */
  const reset = React.useCallback((): void => {
    // Abort any in-flight operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Reset state if still mounted
    if (isMountedRef.current) {
      setIsLoading(false);
      setError(null);
      setData(null);
    }
  }, []);

  // Compute derived state
  const isSuccess = !isLoading && !error && data !== null;
  const isError = !isLoading && error !== null;

  return {
    isLoading,
    error,
    data,
    isSuccess,
    isError,
    execute,
    reset,
  };
}
