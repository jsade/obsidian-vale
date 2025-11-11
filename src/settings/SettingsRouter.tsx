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
    // Write new changes to disk.
    plugin.settings = settings;
    void plugin.saveSettings();

    setSettings(settings);
  };

  React.useEffect(() => {
    let isMounted = true;

    if (settings.type === "cli" && configManager) {
      void configManager
        .configPathExists()
        .then((res) => {
          if (isMounted) {
            setValidConfigPath(res);
          }
        })
        .catch((error) => {
          console.error("configPathExists error:", error);
        });
    } else {
      setValidConfigPath(false);
    }

    return () => {
      isMounted = false;
    };
  }, [settings, configManager]);

  // Only show StyleSettings in managed mode - custom Vale configs should manage their own styles
  const shouldShowStyles =
    validConfigPath && settings.type === "cli" && settings.cli.managed;

  switch (page) {
    case "General":
      return (
        <>
          <GeneralSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
          {shouldShowStyles && (
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
