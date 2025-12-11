import * as React from "react";
import { useObsidianSetting } from "../../hooks/useObsidianSetting";

/**
 * StylesEmptyState - Empty state for when no styles are found
 *
 * Displays a helpful message when no Vale styles are found in Custom mode.
 * Uses Obsidian's Setting API for consistent styling.
 *
 * This component only appears in Custom mode when the user's StylesPath
 * directory contains no style directories (other than Vale).
 *
 * Nielsen Heuristic Alignment:
 * - H10 (Help): Provides guidance on what to do next
 *
 * @example
 * ```tsx
 * {isCustomMode && customStylesCount === 0 && <StylesEmptyState />}
 * ```
 */
export const StylesEmptyState: React.FC = () => {
  const containerRef = useObsidianSetting(
    {
      name: "No styles found",
      desc: "Add Vale styles to your styles path directory to view them here.",
    },
    [],
  );

  return <div ref={containerRef} />;
};
