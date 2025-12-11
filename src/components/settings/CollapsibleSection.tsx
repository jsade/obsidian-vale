import * as React from "react";

/**
 * Props for CollapsibleSection component.
 */
export interface CollapsibleSectionProps {
  /**
   * Section title displayed in the header.
   */
  title: string;

  /**
   * Optional description shown below the title.
   */
  description?: string;

  /**
   * Whether the section is expanded (controlled mode).
   * If not provided, the component manages its own state.
   */
  expanded?: boolean;

  /**
   * Callback when expanded state changes.
   * Required if using controlled mode (expanded prop).
   */
  onToggle?: (expanded: boolean) => void;

  /**
   * Default expanded state for uncontrolled mode.
   * @default false
   */
  defaultExpanded?: boolean;

  /**
   * Child content to show when expanded.
   */
  children: React.ReactNode;

  /**
   * Optional CSS class for the container.
   */
  className?: string;

  /**
   * Unique ID for accessibility (aria-controls).
   * Auto-generated if not provided.
   */
  id?: string;
}

/**
 * CollapsibleSection - Expandable content section with smooth transitions
 *
 * A reusable collapsible section that follows Obsidian's visual patterns
 * and implements proper accessibility (ARIA) attributes.
 *
 * **Features:**
 * - Smooth height transitions (respects prefers-reduced-motion)
 * - Keyboard accessible (Enter/Space to toggle)
 * - Screen reader announces expanded/collapsed state
 * - Supports both controlled and uncontrolled modes
 * - Uses Obsidian CSS variables for theme compatibility
 *
 * **Controlled vs Uncontrolled:**
 * - Controlled: Pass `expanded` and `onToggle` props
 * - Uncontrolled: Pass `defaultExpanded` (or nothing for collapsed default)
 *
 * **Nielsen Heuristic Alignment:**
 * - H7 (Flexibility): Power users can expand to see more
 * - H8 (Minimalist Design): Hides secondary content by default
 * - H6 (Recognition): Clear visual indicator of expanded state
 *
 * **Accessibility:**
 * - aria-expanded on trigger button
 * - aria-controls links button to content
 * - role="region" on content with aria-labelledby
 * - Native button keyboard support (Enter/Space)
 *
 * @example
 * ```tsx
 * // Uncontrolled (manages own state)
 * <CollapsibleSection title="Advanced Options" defaultExpanded={false}>
 *   <AdvancedSettings />
 * </CollapsibleSection>
 *
 * // Controlled (parent manages state)
 * const [expanded, setExpanded] = useState(false);
 * <CollapsibleSection
 *   title="Details"
 *   expanded={expanded}
 *   onToggle={setExpanded}
 * >
 *   <DetailContent />
 * </CollapsibleSection>
 * ```
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  description,
  expanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
  children,
  className,
  id: providedId,
}) => {
  // Generate stable ID for accessibility
  const generatedId = React.useId();
  const id = providedId ?? `collapsible-${generatedId}`;
  const contentId = `${id}-content`;

  // Internal state for uncontrolled mode
  const [internalExpanded, setInternalExpanded] =
    React.useState(defaultExpanded);

  // Determine if we're in controlled mode
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  // Ref for measuring content height
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number | null>(null);

  /**
   * Handle toggle click/keyboard activation.
   */
  const handleToggle = React.useCallback(() => {
    const newExpanded = !expanded;
    if (isControlled) {
      onToggle?.(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  }, [expanded, isControlled, onToggle]);

  /**
   * Measure content height for smooth animation.
   * Only needed when expanded to animate from 0 to actual height.
   *
   * Uses isMounted flag because ResizeObserver callbacks fire asynchronously
   * and can trigger after component unmount, causing act() warnings in tests.
   */
  React.useEffect(() => {
    let isMounted = true;

    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (!isMounted) return;
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });

      resizeObserver.observe(contentRef.current);
      return () => {
        isMounted = false;
        resizeObserver.disconnect();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute container class names
  const containerClassName = [
    "vale-collapsible",
    expanded ? "vale-collapsible--expanded" : "vale-collapsible--collapsed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      {/* Header / Toggle Button */}
      <button
        id={id}
        type="button"
        className="vale-collapsible__header"
        onClick={handleToggle}
        aria-expanded={expanded}
        aria-controls={contentId}
      >
        {/* Chevron indicator */}
        <span className="vale-collapsible__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            className="vale-collapsible__chevron"
          >
            <path
              fill="currentColor"
              d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"
            />
          </svg>
        </span>

        {/* Title and description */}
        <span className="vale-collapsible__title-group">
          <span className="vale-collapsible__title">{title}</span>
          {description && (
            <span className="vale-collapsible__description">{description}</span>
          )}
        </span>
      </button>

      {/* Collapsible Content */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={id}
        className="vale-collapsible__content-wrapper"
        style={{
          height: expanded ? (contentHeight ?? "auto") : 0,
          // Use visibility hidden when collapsed to remove from tab order
          // while preserving height transition capability
          visibility: expanded ? "visible" : "hidden",
        }}
        // inert removes descendants from accessibility tree and prevents focus
        // when collapsed - this is the proper way to hide content from keyboards
        {...(!expanded && { inert: "" })}
      >
        <div ref={contentRef} className="vale-collapsible__content">
          {children}
        </div>
      </div>
    </div>
  );
};
