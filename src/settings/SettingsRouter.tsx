import { useConfigManager } from "hooks";
import ValePlugin from "main";
import React from "react";
import { ValeSettings } from "../types";
import { GeneralSettings } from "./GeneralSettings";
import { RuleSettings } from "./RuleSettings";
import { StyleSettings } from "./StyleSettings";

interface Props {
  plugin: ValePlugin;
}

export const SettingsRouter = ({ plugin }: Props): React.ReactElement => {
  const [settings, setSettings] = React.useState<ValeSettings>(plugin.settings);
  const [style, setStyle] = React.useState<string>("");
  const [page, setPage] = React.useState<string>("General");
  const [validConfigPath, setValidConfigPath] = React.useState(false);

  const configManager = useConfigManager(settings);

  const onSettingsChange = (settings: ValeSettings) => {
    console.debug("[DEBUG:SettingsRouter] onSettingsChange called", {
      type: settings.type,
      managed: settings.type === "cli" ? settings.cli.managed : "N/A",
      valePath: settings.type === "cli" ? settings.cli.valePath : "N/A",
      configPath: settings.type === "cli" ? settings.cli.configPath : "N/A",
    });
    // Write new changes to disk.
    plugin.settings = settings;
    console.debug("[DEBUG:SettingsRouter] Calling plugin.saveSettings()");
    void plugin.saveSettings();

    console.debug("[DEBUG:SettingsRouter] Calling setSettings()");
    setSettings(settings);
  };

  React.useEffect(() => {
    console.debug(
      "[DEBUG:SettingsRouter] Config validation useEffect triggered",
      {
        type: settings.type,
        hasConfigManager: !!configManager,
      },
    );

    let isMounted = true;

    if (settings.type === "cli" && configManager) {
      void configManager
        .configPathExists()
        .then((res) => {
          if (isMounted) {
            console.debug(
              "[DEBUG:SettingsRouter] configPathExists result:",
              res,
            );
            setValidConfigPath(res);
          } else {
            console.debug(
              "[DEBUG:SettingsRouter] Component unmounted, skipping setValidConfigPath",
            );
          }
        })
        .catch((error) => {
          console.error(
            "[DEBUG:SettingsRouter] configPathExists error:",
            error,
          );
        });
    } else {
      console.debug("[DEBUG:SettingsRouter] Setting validConfigPath to false");
      setValidConfigPath(false);
    }

    return () => {
      console.debug(
        "[DEBUG:SettingsRouter] Config validation useEffect cleanup",
      );
      isMounted = false;
    };
  }, [settings, configManager]);

  switch (page) {
    case "General":
      return (
        <>
          <GeneralSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
          {validConfigPath && (
            <StyleSettings
              settings={settings}
              navigate={(page: string, context: string) => {
                setStyle(context);
                setPage(page);
              }}
            />
          )}
        </>
      );
    case "Rules":
      return (
        <RuleSettings
          settings={settings}
          style={style}
          navigate={(page: string, context: string) => {
            setStyle(context);
            setPage(page);
          }}
        />
      );
    default:
      return <div></div>;
  }
};
