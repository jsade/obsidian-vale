import { useConfigManager } from "hooks";
import { Setting } from "obsidian";
import * as React from "react";
import { LoaderCube } from "../components/LoaderCube";
import { ValidationResult } from "../vale/ValeConfigManager";
import { ValeSettings } from "../types";

interface Props {
  settings: ValeSettings;
  onSettingsChange: (settings: ValeSettings) => void;
}

export const GeneralSettings = ({
  settings,
  onSettingsChange,
}: Props): React.ReactElement => {
  const [onboarding, setOnboarding] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const configManager = useConfigManager(settings);

  // Store validation results in state so they persist across UI recreations
  const [valePathValidation, setValePathValidation] =
    React.useState<ValidationResult | null>(null);
  const [configPathValidation, setConfigPathValidation] =
    React.useState<ValidationResult | null>(null);

  // Refs to track the Setting instances so we can update their descriptions
  const valePathSettingRef = React.useRef<Setting | null>(null);
  const configPathSettingRef = React.useRef<Setting | null>(null);

  // Track previous values to prevent unnecessary re-renders
  // Start with null to ensure first render always executes
  const prevSettingsRef = React.useRef<{
    type: string;
    managed: boolean;
    serverUrl: string;
  } | null>(null);

  // Validation function to check custom Vale paths and store results in state
  const validatePaths = React.useCallback(async () => {
    if (!configManager) {
      // Clear validation state when configManager is not available
      setValePathValidation(null);
      setConfigPathValidation(null);
      return;
    }

    // Only validate if we're in CLI mode and custom (not managed)
    if (settings.type !== "cli" || settings.cli.managed) {
      setValePathValidation(null);
      setConfigPathValidation(null);
      return;
    }

    // Validate Vale path only if it's not empty
    if (settings.cli.valePath && settings.cli.valePath.trim() !== "") {
      const valeResult = await configManager.validateValePath();
      setValePathValidation(valeResult);
    } else {
      setValePathValidation(null);
    }

    // Validate Config path only if it's not empty
    if (settings.cli.configPath && settings.cli.configPath.trim() !== "") {
      const configResult = await configManager.validateConfigPath();
      setConfigPathValidation(configResult);
    } else {
      setConfigPathValidation(null);
    }
  }, [
    configManager,
    settings.type,
    settings.cli.managed,
    settings.cli.valePath,
    settings.cli.configPath,
  ]);

  // Helper to update Setting description with validation result
  const updateSettingDescription = React.useCallback(
    (
      setting: Setting,
      baseDescription: string,
      validation: ValidationResult | null,
    ) => {
      if (!validation) {
        // No validation result - show base description
        setting.setDesc(baseDescription);
      } else if (validation.valid) {
        // Show success indicator
        setting.setDesc(`${baseDescription} ✓`);
      } else if (validation.error) {
        // Show error message in red
        const descEl = setting.descEl;
        descEl.empty();
        descEl.createSpan({ text: baseDescription });
        descEl.createEl("br");
        const errorSpan = descEl.createSpan({
          text: `❌ ${validation.error}`,
        });
        errorSpan.setCssProps({ color: "var(--text-error)" });
      }
    },
    [],
  );

  // Check whether the user have configured a path to a valid config file.
  React.useEffect(() => {
    let isMounted = true;

    if (settings.type === "cli" && configManager) {
      void configManager
        .valePathExists()
        .then((exists) => {
          if (isMounted) {
            setOnboarding(!exists);
          }
        })
        .catch((error) => {
          console.error("valePathExists error:", error);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [settings, configManager]);

  // Validate paths when they change or when configManager becomes available
  React.useEffect(() => {
    void validatePaths();
  }, [validatePaths]);

  // Update Setting descriptions when validation results change (without recreating UI)
  React.useEffect(() => {
    if (valePathSettingRef.current) {
      updateSettingDescription(
        valePathSettingRef.current,
        "Absolute path to the Vale binary.",
        valePathValidation,
      );
    }
  }, [valePathValidation, updateSettingDescription]);

  React.useEffect(() => {
    if (configPathSettingRef.current) {
      updateSettingDescription(
        configPathSettingRef.current,
        "Absolute path to a Vale config file.",
        configPathValidation,
      );
    }
  }, [configPathValidation, updateSettingDescription]);

  // Effect to recreate Settings UI when certain values change
  React.useEffect(() => {
    const currentValues = {
      type: settings.type,
      managed: settings.type === "cli" ? settings.cli.managed : false,
      serverUrl: settings.type === "server" ? settings.server.url : "",
    };

    // Check if relevant values have actually changed
    // If this is the first render (null), always proceed
    const hasChanged =
      prevSettingsRef.current === null ||
      prevSettingsRef.current.type !== currentValues.type ||
      prevSettingsRef.current.managed !== currentValues.managed ||
      prevSettingsRef.current.serverUrl !== currentValues.serverUrl;

    if (!hasChanged) {
      return;
    }

    // Update the ref with current values
    prevSettingsRef.current = currentValues;

    void (async () => {
      if (ref.current) {
        ref.current.empty();

        new Setting(ref.current)
          .setName("Enable Vale Server")
          .setDesc("If disabled, you need to have Vale CLI installed.")
          .addToggle((toggle) => {
            const handleChange = async (value: boolean) => {
              onSettingsChange({
                ...settings,
                type: value ? "server" : "cli",
              });
            };
            return toggle
              .setValue(settings.type === "server")
              .onChange(handleChange);
          });

        if (settings.type === "server") {
          new Setting(ref.current)
            .setName("Server URL")
            .setDesc("Address to a running Vale Server instance.")
            .addText((text) => {
              const component = text
                .setValue(settings.server.url)
                .setPlaceholder("http://localhost:7777");

              component.inputEl.onblur = async (value: FocusEvent) => {
                onSettingsChange({
                  ...settings,
                  server: {
                    ...settings.server,
                    url: (value.currentTarget as HTMLInputElement).value,
                  },
                });
              };

              return component;
            });
        } else {
          new Setting(ref.current)
            .setName("Use managed Vale CLI")
            .setDesc(
              "Install Vale to your vault. Disable if you want to use an existing Vale configuration.",
            )
            .addToggle((toggle) => {
              const handleChange = (managed: boolean) => {
                onSettingsChange({
                  ...settings,
                  cli: { ...settings.cli, managed },
                });
              };
              return toggle
                .setValue(settings.cli.managed)
                .onChange(handleChange);
            });

          if (!settings.cli.managed) {
            // Store references to both input elements to avoid stale closure issues
            let valePathInput: HTMLInputElement;
            let configPathInput: HTMLInputElement;

            // Helper to read both values from DOM and update settings
            const updateBothPaths = () => {
              onSettingsChange({
                ...settings,
                cli: {
                  ...settings.cli,
                  valePath: valePathInput?.value || "",
                  configPath: configPathInput?.value || "",
                },
              });
              // Validation will be triggered automatically by the validatePaths useEffect
            };

            const valePathSetting = new Setting(ref.current)
              .setName("Vale path")
              .setDesc("Absolute path to the Vale binary.")
              .addText((text) => {
                const component = text.setValue(settings.cli.valePath ?? "");
                valePathInput = component.inputEl;

                component.inputEl.onblur = async () => {
                  updateBothPaths();
                };

                return component;
              });

            // Store reference to Vale path Setting for later updates
            valePathSettingRef.current = valePathSetting;

            const configPathSetting = new Setting(ref.current)
              .setName("Config path")
              .setDesc("Absolute path to a Vale config file.")
              .addText((text) => {
                const component = text.setValue(settings.cli.configPath ?? "");
                configPathInput = component.inputEl;

                component.inputEl.onblur = async () => {
                  updateBothPaths();
                };

                return component;
              });

            // Store reference to Config path Setting for later updates
            configPathSettingRef.current = configPathSetting;
          }
        }
      }
    })();
  }, [settings]);

  return (
    <>
      {onboarding && (
        <Onboarding settings={settings} onSettingsChange={onSettingsChange} />
      )}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <small>
          {"If you found this plugin useful, you can "}
          <a href="https://www.buymeacoffee.com/marcusolsson">
            buy Marcus a coffee
          </a>
          {" as a thank you ☕."}
        </small>
      </div>
      <div ref={ref} />
    </>
  );
};

interface OnboardingProps {
  settings: ValeSettings;
  onSettingsChange: (settings: ValeSettings) => void;
}

export const Onboarding = ({
  settings,
  onSettingsChange,
}: OnboardingProps): React.ReactElement => {
  const configManager = useConfigManager(settings);
  return (
    <div className="card" style={{ marginBottom: "2rem" }}>
      <h2>{"Get started with Vale"}</h2>
      <p>
        This plugin is a graphical interface for{" "}
        <a href="https://docs.errata.ai">Vale</a>. To use this plugin, you first
        need to set up Vale.
      </p>
      <p>
        <strong>{"If this is your first time using Vale"}</strong>, you can use{" "}
        <em>managed mode</em> to install the Vale CLI to your vault, for minimal
        configuration.
      </p>
      {settings.cli.managed ? (
        <DownloadButton
          onInstall={async () => {
            if (!configManager) {
              console.error("Config manager not available");
              return;
            }
            await configManager.initializeDataPath();
            await configManager.installVale();
          }}
          onInstalled={() => onSettingsChange({ ...settings })}
        />
      ) : (
        <button
          onClick={() =>
            onSettingsChange({
              ...settings,
              cli: {
                ...settings.cli,
                managed: true,
              },
            })
          }
        >
          Enable managed mode
        </button>
      )}
      <p>
        <strong>{"If you're already using Vale"}</strong>
        {
          ", you can configure the URL to a running Vale Server, or disable managed Vale CLI to configure the paths to an existing Vale CLI installation."
        }
      </p>
    </div>
  );
};

interface DownloadButtonProps {
  onInstall: () => Promise<void>;
  onInstalled: () => void;
}

export const DownloadButton = ({
  onInstall,
  onInstalled,
}: DownloadButtonProps): React.ReactElement => {
  const [downloading, setDownloading] = React.useState(false);

  return downloading ? (
    <LoaderCube />
  ) : (
    <button
      style={{ marginBottom: "1rem" }}
      className="mod-cta"
      onClick={() => {
        void (async () => {
          setDownloading(true);

          try {
            await onInstall();
          } finally {
            setDownloading(false);
            onInstalled();
          }
        })();
      }}
    >
      Install Vale to vault
    </button>
  );
};
