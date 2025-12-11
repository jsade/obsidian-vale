import * as React from "react";
import { ValeConfig } from "../types";
import { ValeConfigManager } from "../vale/ValeConfigManager";

/**
 * Validation result for Vale config file.
 */
export interface ConfigValidationResult {
  /** Whether the config is valid and can be parsed */
  valid: boolean;
  /** Parsed config object, if validation succeeded */
  config: ValeConfig | null;
  /** Error message if validation failed */
  error?: string;
  /** Whether validation is currently in progress */
  isValidating: boolean;
}

/**
 * Default config validation result (before validation runs).
 */
const DEFAULT_CONFIG_VALIDATION: ConfigValidationResult = {
  valid: false,
  config: null,
  error: undefined,
  isValidating: false,
};

/**
 * Debounce delay in milliseconds.
 * Config validation will only run after this delay of inactivity.
 */
const DEBOUNCE_DELAY_MS = 500;

/**
 * Custom hook for validating and parsing Vale config files.
 *
 * Features:
 * - Validates config file exists and is readable
 * - Parses config file to ValeConfig object
 * - Validates config structure and required fields
 * - Debounced validation (500ms delay)
 * - AbortController for cleanup and cancellation
 * - Only validates when configManager is available
 *
 * @param configManager - ValeConfigManager instance (may be undefined)
 * @returns Validation result with parsed config
 *
 * @example
 * ```tsx
 * const configManager = useConfigManager(settings);
 * const configValidation = useConfigValidation(configManager);
 *
 * if (configValidation.isValidating) {
 *   return <div>Validating config...</div>;
 * }
 *
 * if (configValidation.valid && configValidation.config) {
 *   const stylesPath = configValidation.config.StylesPath;
 *   // Use parsed config
 * }
 *
 * if (configValidation.error) {
 *   return <div>Config error: {configValidation.error}</div>;
 * }
 * ```
 */
export function useConfigValidation(
  configManager: ValeConfigManager | undefined,
): ConfigValidationResult {
  // State: Validation result
  const [validation, setValidation] = React.useState<ConfigValidationResult>(
    DEFAULT_CONFIG_VALIDATION,
  );

  // Ref: AbortController for cancelling in-flight validations
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Ref: Timeout ID for debouncing
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Validate and parse the config file.
   */
  const validateConfig = React.useCallback(
    async (signal: AbortSignal): Promise<void> => {
      if (!configManager) {
        // Clear validation state if configManager unavailable
        setValidation(DEFAULT_CONFIG_VALIDATION);
        return;
      }

      // Set validating state
      setValidation({
        valid: false,
        config: null,
        error: undefined,
        isValidating: true,
      });

      try {
        // Step 1: Validate config path exists and is readable
        const pathValidation = await configManager.validateConfigPath();

        // Check if aborted before continuing
        if (signal.aborted) {
          return;
        }

        if (!pathValidation.valid) {
          // Path validation failed
          setValidation({
            valid: false,
            config: null,
            error: pathValidation.error || "Config path is invalid",
            isValidating: false,
          });
          return;
        }

        // Step 2: Load and parse config file
        const config = await configManager.loadConfig();

        // Check if aborted before updating state
        if (signal.aborted) {
          return;
        }

        // Step 3: Validate config structure
        const structureValidation = validateConfigStructure(config);

        if (!structureValidation.valid) {
          // Structure validation failed
          setValidation({
            valid: false,
            config: null,
            error: structureValidation.error,
            isValidating: false,
          });
          return;
        }

        // Success: Config is valid
        setValidation({
          valid: true,
          config,
          error: undefined,
          isValidating: false,
        });
      } catch (error) {
        // Check if aborted before updating state
        if (signal.aborted) {
          return;
        }

        // Handle validation error
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to validate config file";
        setValidation({
          valid: false,
          config: null,
          error: errorMessage,
          isValidating: false,
        });
      }
    },
    [configManager],
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

      // Run validation
      void validateConfig(abortController.signal);
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
  }, [validateConfig]);

  return validation;
}

/**
 * Validate the structure of a ValeConfig object.
 * Ensures required fields are present and properly formatted.
 *
 * @param config - Config object to validate
 * @returns Validation result with error message if invalid
 */
function validateConfigStructure(config: ValeConfig): {
  valid: boolean;
  error?: string;
} {
  // Validate that config is an object
  if (!config || typeof config !== "object") {
    return {
      valid: false,
      error: "Config file is not a valid object",
    };
  }

  // Validate StylesPath (optional, but must be a string if present)
  if (
    config.StylesPath !== undefined &&
    typeof config.StylesPath !== "string"
  ) {
    return {
      valid: false,
      error: "StylesPath must be a string",
    };
  }

  // Validate "*" section exists
  if (!config["*"] || typeof config["*"] !== "object") {
    return {
      valid: false,
      error: 'Config file must have a "*" section',
    };
  }

  // Validate "md" subsection exists within "*"
  if (!config["*"].md || typeof config["*"].md !== "object") {
    return {
      valid: false,
      error: 'Config file must have a "*.md" section',
    };
  }

  // Validate BasedOnStyles (optional, but must be a string if present)
  if (
    config["*"].md.BasedOnStyles !== undefined &&
    typeof config["*"].md.BasedOnStyles !== "string"
  ) {
    return {
      valid: false,
      error: "BasedOnStyles must be a string",
    };
  }

  // Config structure is valid
  return { valid: true };
}
