import * as React from "react";

/**
 * ManagedModeSettings - Configuration for managed Vale CLI
 *
 * In managed mode, the plugin automatically:
 * - Downloads Vale binary to vault's plugin data directory
 * - Creates and manages .vale.ini config file
 * - Downloads and manages style packages
 *
 * This component provides informational text about managed mode.
 * The actual Vale installation is handled via the OnboardingBanner.
 *
 * Architecture:
 * - Pure React component (no Obsidian Settings)
 * - Read-only information display
 * - Links to docs for more info
 *
 * Nielsen Heuristic Alignment:
 * - H1 (Visibility): Shows what managed mode provides
 * - H6 (Recognition): Clear explanation of managed features
 * - H10 (Help): Links to documentation
 *
 * Accessibility:
 * - Semantic HTML structure
 * - Clear heading hierarchy
 * - Descriptive link text
 *
 * @example
 * ```tsx
 * {settings.cli.managed && <ManagedModeSettings />}
 * ```
 */
export const ManagedModeSettings: React.FC = () => {
  return (
    <div className="vale-managed-mode-info">
      <div className="vale-info-card">
        <h3 className="vale-info-card__title">Managed Vale CLI</h3>
        <p className="vale-info-card__description">
          In managed mode, Vale will be automatically downloaded and configured
          in your vault's plugin data directory. The plugin manages:
        </p>
        <ul className="vale-info-card__list">
          <li>Vale binary installation and updates</li>
          <li>Vale configuration file (.vale.ini)</li>
          <li>Style packages and rules</li>
        </ul>
        <p className="vale-info-card__description">
          You can manage styles and rules through the Styles tab after Vale is
          installed.
        </p>
      </div>
    </div>
  );
};
