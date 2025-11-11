import { useConfigManager } from "hooks";
import { Setting } from "obsidian";
import * as React from "react";
import { LoaderCube } from "../components/LoaderCube";
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

  // Track previous values to prevent unnecessary re-renders
  // Start with null to ensure first render always executes
  const prevSettingsRef = React.useRef<{
    type: string;
    managed: boolean;
    serverUrl: string;
  } | null>(null);

  // Check whether the user have configured a path to a valid config file.
  React.useEffect(() => {
    console.debug("[DEBUG:GeneralSettings] Onboarding useEffect triggered", {
      type: settings.type,
      hasConfigManager: !!configManager,
    });

    let isMounted = true;

    if (settings.type === "cli" && configManager) {
      void configManager
        .valePathExists()
        .then((exists) => {
          if (isMounted) {
            console.debug(
              "[DEBUG:GeneralSettings] valePathExists result:",
              exists,
            );
            setOnboarding(!exists);
          } else {
            console.debug(
              "[DEBUG:GeneralSettings] Component unmounted, skipping setOnboarding",
            );
          }
        })
        .catch((error) => {
          console.error("[DEBUG:GeneralSettings] valePathExists error:", error);
        });
    }

    return () => {
      console.debug("[DEBUG:GeneralSettings] Onboarding useEffect cleanup");
      isMounted = false;
    };
  }, [settings, configManager]);

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

    console.debug(
      "[DEBUG:GeneralSettings] useEffect triggered - settings changed",
      {
        type: settings.type,
        managed: settings.type === "cli" ? settings.cli.managed : "N/A",
        hasConfigManager: !!configManager,
        hasChanged,
        isFirstRender: prevSettingsRef.current === null,
        prevType: prevSettingsRef.current?.type,
        prevManaged: prevSettingsRef.current?.managed,
      },
    );

    if (!hasChanged) {
      console.debug(
        "[DEBUG:GeneralSettings] No relevant changes detected, skipping UI rebuild",
      );
      return;
    }

    // Update the ref with current values
    prevSettingsRef.current = currentValues;

    void (async () => {
      if (ref.current) {
        console.debug(
          "[DEBUG:GeneralSettings] Emptying ref.current and recreating UI",
        );
        ref.current.empty();

        new Setting(ref.current)
          .setName("Enable Vale Server")
          .setDesc("If disabled, you need to have Vale CLI installed.")
          .addToggle((toggle) => {
            const handleChange = async (value: boolean) => {
              console.debug("[DEBUG:GeneralSettings] Server toggle changed", {
                from: settings.type,
                to: value ? "server" : "cli",
              });
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
                console.debug(
                  "[DEBUG:GeneralSettings] Managed toggle changed",
                  {
                    from: settings.cli.managed,
                    to: managed,
                  },
                );
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
              console.debug(
                "[DEBUG:GeneralSettings] Updating both CLI paths from DOM",
                {
                  valePath: valePathInput?.value,
                  configPath: configPathInput?.value,
                },
              );
              onSettingsChange({
                ...settings,
                cli: {
                  ...settings.cli,
                  valePath: valePathInput?.value || "",
                  configPath: configPathInput?.value || "",
                },
              });
            };

            new Setting(ref.current)
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

            new Setting(ref.current)
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
          }
        }
      }
      console.debug("[DEBUG:GeneralSettings] useEffect async block completed");
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
