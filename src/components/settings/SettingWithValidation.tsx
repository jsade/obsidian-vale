import * as React from "react";
import { Setting } from "obsidian";
import { FieldValidation } from "../../types/validation";

/**
 * Props for SettingWithValidation component.
 */
export interface SettingWithValidationProps {
  /**
   * Validation state for this setting.
   * Controls the display of validation feedback (spinner, checkmark, error).
   */
  validation: FieldValidation;

  /**
   * Render function that creates the Setting.
   * Called with the container element where the Setting should be rendered.
   *
   * @param containerEl - The HTML element to render the Setting into
   * @returns The created Setting instance (optional, for ref tracking)
   *
   * @example
   * ```tsx
   * <SettingWithValidation validation={validation}>
   *   {(containerEl) => {
   *     return new Setting(containerEl)
   *       .setName("Path")
   *       .addText(text => text.setValue(value).onChange(onChange));
   *   }}
   * </SettingWithValidation>
   * ```
   */
  children: (containerEl: HTMLElement) => Setting | void;

  /**
   * Base description text to show when no validation error is present.
   * If not provided, validation errors will replace the Setting's description.
   */
  baseDescription?: string;
}

/**
 * Wrapper component that adds validation feedback to an Obsidian Setting.
 *
 * This component bridges Obsidian's imperative Setting API with React's
 * declarative validation state. It renders validation feedback based on
 * the FieldValidation state:
 *
 * - **idle**: No feedback shown
 * - **validating**: Spinner shown in description
 * - **valid**: Checkmark shown after description
 * - **error**: Error message shown in red below description
 *
 * **Architecture principle**: Use Obsidian Setting API for the control itself,
 * React for validation state management and feedback display.
 *
 * @example
 * Basic usage with text input:
 * ```tsx
 * function PathSetting({ path, onChange, validation }: Props) {
 *   return (
 *     <SettingWithValidation
 *       validation={validation}
 *       baseDescription="Path to Vale binary"
 *     >
 *       {(containerEl) => {
 *         new Setting(containerEl)
 *           .setName("Vale binary path")
 *           .setDesc("Path to Vale binary")
 *           .addText(text => text
 *             .setValue(path)
 *             .onChange(onChange)
 *           );
 *       }}
 *     </SettingWithValidation>
 *   );
 * }
 * ```
 *
 * @example
 * With custom description handling:
 * ```tsx
 * <SettingWithValidation validation={configPathValidation}>
 *   {(containerEl) => {
 *     const setting = new Setting(containerEl)
 *       .setName("Config path")
 *       .addText(text => text
 *         .setValue(configPath)
 *         .onChange(handleChange)
 *       );
 *
 *     // Description is managed by SettingWithValidation
 *     // based on validation state
 *     return setting;
 *   }}
 * </SettingWithValidation>
 * ```
 */
export const SettingWithValidation: React.FC<SettingWithValidationProps> = ({
  validation,
  children,
  baseDescription,
}) => {
  // Ref: Container element for the Setting
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Ref: Track the Setting instance for updating description
  const settingRef = React.useRef<Setting | null>(null);

  /**
   * Effect: Create the Setting when component mounts or validation changes.
   * We recreate on validation change to ensure proper description updates.
   */
  React.useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    // Clear previous Setting
    containerRef.current.empty();

    // Create new Setting via children render function
    const setting = children(containerRef.current);
    settingRef.current = setting || null;

    // Apply validation feedback if Setting was created
    if (setting) {
      updateValidationFeedback(setting, validation, baseDescription);
    }

    // Cleanup: Clear on unmount
    return () => {
      if (containerRef.current) {
        containerRef.current.empty();
      }
      settingRef.current = null;
    };
  }, [validation, children, baseDescription]);

  return <div ref={containerRef} />;
};

/**
 * Update a Setting's description to show validation feedback.
 *
 * This function modifies the Setting's descEl to display appropriate
 * feedback based on validation status:
 *
 * - **idle**: Show base description (if provided)
 * - **validating**: Show spinner with "Validating..." text
 * - **valid**: Show checkmark after description
 * - **error**: Show error message in red below description
 *
 * @param setting - The Setting instance to update
 * @param validation - Current validation state
 * @param baseDescription - Base description text to show when no error
 */
function updateValidationFeedback(
  setting: Setting,
  validation: FieldValidation,
  baseDescription?: string,
): void {
  const { descEl } = setting;

  // Clear existing description content
  descEl.empty();

  // Show validation feedback based on status
  switch (validation.status) {
    case "idle":
      // No validation - show base description if provided
      if (baseDescription) {
        descEl.createSpan({ text: baseDescription });
      }
      break;

    case "validating":
      // Validating - show spinner and message
      if (baseDescription) {
        descEl.createSpan({ text: baseDescription });
        descEl.createSpan({ text: " " });
      }
      descEl.createSpan({
        text: "⏳ Validating...",
        cls: "vale-validating",
      });
      break;

    case "valid": {
      // Valid - show base description with checkmark
      if (baseDescription) {
        descEl.createSpan({ text: baseDescription });
        descEl.createSpan({ text: " " });
      }
      const checkmark = descEl.createSpan({
        text: "✓",
        cls: "vale-validation-success",
      });
      checkmark.setCssProps({
        color: "var(--text-success)",
        fontWeight: "bold",
      });
      break;
    }

    case "error":
      // Error - show base description, then error message in red
      if (baseDescription) {
        descEl.createSpan({ text: baseDescription });
      }

      if (validation.result?.error) {
        descEl.createEl("br");
        const errorSpan = descEl.createSpan({
          text: `❌ ${validation.result.error}`,
          cls: "vale-validation-error",
        });
        errorSpan.setCssProps({
          color: "var(--text-error)",
        });

        // Show suggestion if available
        if (validation.result.suggestion) {
          descEl.createEl("br");
          const suggestionSpan = descEl.createSpan({
            text: `💡 ${validation.result.suggestion}`,
            cls: "vale-validation-suggestion",
          });
          suggestionSpan.setCssProps({
            color: "var(--text-muted)",
            fontSize: "0.9em",
          });
        }
      }
      break;
  }
}
