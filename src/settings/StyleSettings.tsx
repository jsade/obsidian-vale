import { useConfigManager } from "hooks";
import { Setting } from "obsidian";
import React from "react";
import { ErrorMessage } from "../components/ErrorMessage";
import { ValeSettings, ValeStyle } from "../types";

interface Props {
  settings: ValeSettings;
  navigate: (page: string, context: string) => void;
}

export const StyleSettings = ({
  settings,
  navigate,
}: Props): React.ReactElement => {
  const [installedStyles, setInstalledStyles] = React.useState<ValeStyle[]>([]);
  const [enabledStyles, setEnabledStyles] = React.useState<string[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const ref = React.useRef<HTMLDivElement | null>(null);

  const configManager = useConfigManager(settings);

  React.useEffect(() => {
    // Clear previous error state before loading (prevents stale errors after config fixes)
    setLoadError(null);

    // Early return if configManager not available yet
    if (!configManager) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        if (await configManager.configPathExists()) {
          if (isMounted) {
            const isCustomMode = !settings.cli.managed;
            setInstalledStyles(
              isCustomMode
                ? await configManager.getInstalledStyles()
                : await configManager.getAvailableStyles(),
            );
            setEnabledStyles(await configManager.getEnabledStyles());
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          const message = err instanceof Error ? err.message : String(err);
          setLoadError(message);
        }
        return;
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [configManager, settings.cli.managed]);

  // Show error message if styles loading failed
  if (loadError) {
    const isCustomMode = !settings.cli.managed;
    const modeLabel = isCustomMode ? "Custom" : "Managed";

    return (
      <div className="obsidian-vale">
        <ErrorMessage
          message="Cannot load Vale styles"
          details={`We couldn't find your Vale styles folder.\n\nYou're using ${modeLabel} mode${isCustomMode ? `, which reads styles from your .vale.ini config file` : ""}.\n\nThis usually happens when:\n• The styles folder was moved, renamed, or deleted\n• The path in your config file has a typo\n• Vale is looking in the wrong location\n\nTo fix this:\n1. Go to General settings and check your config path\n2. Open your .vale.ini file and verify the StylesPath value\n3. Create the styles folder if it doesn't exist\n\nTechnical details: ${loadError}`}
        />
        <div style={{ marginTop: "1rem" }}>
          <button
            className="mod-cta"
            onClick={() => navigate("General", "")}
            style={{ marginRight: "0.5rem" }}
          >
            Go to General Settings
          </button>
        </div>
      </div>
    );
  }

  if (ref.current) {
    ref.current.empty();

    // Phase 2.2 - Dynamic heading based on mode
    const isCustomMode = !settings.cli.managed;
    new Setting(ref.current)
      .setHeading()
      .setName(isCustomMode ? "Installed Styles" : "Vale styles")
      .setDesc(
        isCustomMode
          ? "Enable or disable styles found in your Vale StylesPath."
          : "A collection of officially supported styles.",
      );

    // Phase 2.4 - Empty state handling for Custom mode
    // Exclude Vale from count since it's handled separately above
    const customStylesCount = installedStyles.filter(
      (s) => s.name !== "Vale",
    ).length;
    if (isCustomMode && customStylesCount === 0) {
      new Setting(ref.current)
        .setName("No styles found")
        .setDesc(
          "Add Vale styles to your styles path directory to view them here.",
        );
    }

    new Setting(ref.current)
      .setName("Vale")
      .setDesc("Default style for spelling.")
      .addToggle((toggle) =>
        toggle
          .setValue(enabledStyles.contains("Vale"))
          .onChange(async (value) => {
            if (!configManager) return;
            try {
              if (value) {
                await configManager.enableStyle("Vale");
                const newstyles = new Set(enabledStyles);
                newstyles.add("Vale");
                setEnabledStyles([...newstyles]);
              } else {
                await configManager.disableStyle("Vale");
                const newstyles = new Set(enabledStyles);
                newstyles.delete("Vale");
                setEnabledStyles([...newstyles]);
              }
            } catch (error) {
              console.error(
                `Failed to ${value ? "enable" : "disable"} Vale style:`,
                error,
              );
            }
          }),
      );

    // Filter out Vale - it's handled separately with the hardcoded toggle above
    installedStyles
      .filter((style) => style.name !== "Vale")
      .forEach((style) => {
        if (!ref.current) return;
        const setting = new Setting(ref.current)
          .setName(style.name)
          .setDesc(style.description || "");

        if (enabledStyles.contains(style.name)) {
          setting.addExtraButton((button) =>
            button.setIcon("gear").onClick(() => {
              navigate("Rules", style.name);
            }),
          );
        }

        setting.addToggle((toggle) =>
          toggle
            .setValue(enabledStyles.contains(style.name))
            .onChange(async (enabled) => {
              if (!configManager) return;
              try {
                if (enabled) {
                  // Managed mode: install then enable; Custom mode: only enable
                  if (!isCustomMode && style.url) {
                    await configManager.installStyle(style);
                  }
                  await configManager.enableStyle(style.name);
                  const newstyles = new Set(enabledStyles);
                  newstyles.add(style.name);
                  setEnabledStyles([...newstyles]);
                } else {
                  await configManager.disableStyle(style.name);
                  // Managed mode: uninstall after disable; Custom mode: only disable
                  if (!isCustomMode && style.url) {
                    await configManager.uninstallStyle(style);
                  }
                  const newstyles = new Set(enabledStyles);
                  newstyles.delete(style.name);
                  setEnabledStyles([...newstyles]);
                }
              } catch (error) {
                console.error(
                  `Failed to ${enabled ? "enable" : "disable"} style ${style.name}:`,
                  error,
                );
              }
            }),
        );
      });
  }

  return <div ref={ref} />;
};
