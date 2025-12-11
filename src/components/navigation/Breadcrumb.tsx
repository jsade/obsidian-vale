import React from "react";

/**
 * Breadcrumb item configuration
 */
export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

/**
 * Breadcrumb component props
 */
export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  ariaLabel?: string;
}

/**
 * Breadcrumb component for hierarchical navigation.
 *
 * Implements WAI-ARIA breadcrumb pattern with:
 * - `aria-label="Breadcrumb"` on nav element
 * - Current page marked with `aria-current="page"`
 * - Proper list semantics (ordered list)
 * - Keyboard accessible links/buttons
 * - Visual separators between items
 *
 * Items without onClick handlers are rendered as static text (current page).
 * Items with onClick handlers are rendered as clickable buttons.
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: "General", onClick: () => navigate({ page: "General" }) },
 *     { label: "Styles", onClick: () => navigate({ page: "Styles" }) },
 *     { label: "Google" } // Current page, no onClick
 *   ]}
 * />
 * ```
 */
export const Breadcrumb = ({
  items,
  ariaLabel = "Breadcrumb",
}: BreadcrumbProps): React.ReactElement => {
  if (items.length === 0) {
    return <></>;
  }

  /**
   * Handle keyboard activation for breadcrumb links (Enter or Space)
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    onClick?: () => void,
  ) => {
    if ((event.key === "Enter" || event.key === " ") && onClick) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <nav aria-label={ariaLabel} className="vale-breadcrumb">
      <ol className="vale-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = isLast || !item.onClick;

          return (
            <li key={item.label} className="vale-breadcrumb__item">
              {item.onClick && !isCurrent ? (
                <button
                  className="vale-breadcrumb__link"
                  onClick={item.onClick}
                  onKeyDown={(e) => handleKeyDown(e, item.onClick)}
                  type="button"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className="vale-breadcrumb__current"
                  aria-current={isCurrent ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="vale-breadcrumb__separator" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
