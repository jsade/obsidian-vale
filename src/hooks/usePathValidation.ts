import * as React from "react";
import { ValeConfigManager } from "../vale/ValeConfigManager";

/**
 * Validation result for a single path.
 */
export interface PathValidationResult {
  /** Whether the path is valid */
  valid: boolean;
  /** Error message if validation failed */
  error?: string;
  /** Whether validation is currently in progress */
  isValidating: boolean;
}

/**
 * Validation state for both Vale binary and config paths.
 */
export interface PathValidationState {
  /** Validation result for Vale binary path */
  valePath: PathValidationResult;
  /** Validation result for config path */
  configPath: PathValidationResult;
}

/**
 * Paths to validate.
 */
export interface PathsToValidate {
  /** Path to Vale binary (optional) */
  valePath?: string;
  /** Path to Vale config file (optional) */
  configPath?: string;
}

/**
 * Default validation result for a path (before validation runs).
 */
const DEFAULT_PATH_VALIDATION: PathValidationResult = {
  valid: false,
  error: undefined,
  isValidating: false,
};

/**
 * Debounce delay in milliseconds.
 * Validation will only run after this delay of inactivity.
 */
const DEBOUNCE_DELAY_MS = 500;

/**
 * Custom hook for validating Vale binary and config file paths.
 *
 * Features:
 * - Debounced validation (500ms delay)
 * - AbortController for cleanup and cancellation
 * - Separate validation state for each path
 * - Only validates non-empty paths
 * - Skips validation when configManager is unavailable
 *
 * @param configManager - ValeConfigManager instance (may be undefined)
 * @param paths - Paths to validate
 * @returns Validation state for both paths
 *
 * @example
 * ```tsx
 * const configManager = useConfigManager(settings);
 * const validation = usePathValidation(configManager, {
 *   valePath: settings.cli.valePath,
 *   configPath: settings.cli.configPath,
 * });
 *
 * if (validation.valePath.valid) {
 *   // Vale binary path is valid
 * }
 * if (validation.configPath.error) {
 *   // Show error: validation.configPath.error
 * }
 * ```
 */
export function usePathValidation(
  configManager: ValeConfigManager | undefined,
  paths: PathsToValidate,
): PathValidationState {
  // State: Validation results for both paths
  const [valePathValidation, setValePathValidation] =
    React.useState<PathValidationResult>(DEFAULT_PATH_VALIDATION);
  const [configPathValidation, setConfigPathValidation] =
    React.useState<PathValidationResult>(DEFAULT_PATH_VALIDATION);

  // Ref: AbortController for cancelling in-flight validations
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Ref: Timeout ID for debouncing
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Validate Vale binary path.
   * Sets isValidating state, performs validation, and updates result.
   */
  const validateValePath = React.useCallback(
    async (signal: AbortSignal): Promise<void> => {
      if (!configManager || !paths.valePath || paths.valePath.trim() === "") {
        // Clear validation state if path is empty or configManager unavailable
        setValePathValidation(DEFAULT_PATH_VALIDATION);
        return;
      }

      // Set validating state
      setValePathValidation({
        valid: false,
        error: undefined,
        isValidating: true,
      });

      try {
        // Perform validation
        const result = await configManager.validateValePath();

        // Check if aborted before updating state
        if (signal.aborted) {
          return;
        }

        // Update validation result
        setValePathValidation({
          valid: result.valid,
          error: result.error,
          isValidating: false,
        });
      } catch (error) {
        // Check if aborted before updating state
        if (signal.aborted) {
          return;
        }

        // Handle validation error
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setValePathValidation({
          valid: false,
          error: errorMessage,
          isValidating: false,
        });
      }
    },
    [configManager, paths.valePath],
  );

  /**
   * Validate config file path.
   * Sets isValidating state, performs validation, and updates result.
   */
  const validateConfigPath = React.useCallback(
    async (signal: AbortSignal): Promise<void> => {
      if (
        !configManager ||
        !paths.configPath ||
        paths.configPath.trim() === ""
      ) {
        // Clear validation state if path is empty or configManager unavailable
        setConfigPathValidation(DEFAULT_PATH_VALIDATION);
        return;
      }

      // Set validating state
      setConfigPathValidation({
        valid: false,
        error: undefined,
        isValidating: true,
      });

      try {
        // Perform validation
        const result = await configManager.validateConfigPath();

        // Check if aborted before updating state
        if (signal.aborted) {
          return;
        }

        // Update validation result
        setConfigPathValidation({
          valid: result.valid,
          error: result.error,
          isValidating: false,
        });
      } catch (error) {
        // Check if aborted before updating state
        if (signal.aborted) {
          return;
        }

        // Handle validation error
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setConfigPathValidation({
          valid: false,
          error: errorMessage,
          isValidating: false,
        });
      }
    },
    [configManager, paths.configPath],
  );

  /**
   * Effect: Debounced validation trigger.
   * Cancels previous validation and schedules new validation after debounce delay.
   */
  React.useEffect(() => {
    // Cancel any pending validation
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Abort any in-flight validation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Schedule new validation after debounce delay
    timeoutRef.current = setTimeout(() => {
      // Create new AbortController for this validation
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Run validations in parallel
      void Promise.all([
        validateValePath(abortController.signal),
        validateConfigPath(abortController.signal),
      ]);
    }, DEBOUNCE_DELAY_MS);

    // Cleanup: Cancel timeout and abort in-flight validation on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [validateValePath, validateConfigPath]);

  // Return combined validation state
  return {
    valePath: valePathValidation,
    configPath: configPathValidation,
  };
}
