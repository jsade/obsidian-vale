import { useConfigManager } from "hooks";
import ValePlugin from "main";
import React from "react";
import { ValeSettings } from "../types";
import { GeneralSettings } from "./GeneralSettings";
import { RuleSettings } from "./RuleSettings";
import { SettingsNav } from "./SettingsNav";
import { StyleSettings } from "./StyleSettings";
import "./settings.css";

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

    const checkConfig = async () => {
      let isValid = false;

      if (settings.type === "cli" && configManager) {
        try {
          isValid = await configManager.configPathExists();
        } catch (error) {
          console.error("configPathExists error:", error);
        }
      }

      if (isMounted) {
        setValidConfigPath(isValid);
      }
    };

    void checkConfig();

    return () => {
      isMounted = false;
    };
  }, [settings, configManager]);

  // Show Styles tab when a valid config path exists (works for both managed and custom modes)
  const shouldShowStyles = validConfigPath && settings.type === "cli";

  // Navigation handler
  const navigate = (newPage: string, context: string = "") => {
    setStyle(context);
    setPage(newPage);
  };

  // Render the current page content
  const renderPage = () => {
    switch (page) {
      case "General":
        return (
          <GeneralSettings
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        );
      case "Styles":
        if (!shouldShowStyles) {
          // Show feedback when Styles tab is accessed but config path is invalid
          return (
            <div className="vale-settings-feedback">
              <p>
                Configure a valid Vale config path in General settings to manage
                styles.
              </p>
            </div>
          );
        }
        return <StyleSettings settings={settings} navigate={navigate} />;
      case "Rules":
        return (
          <RuleSettings settings={settings} style={style} navigate={navigate} />
        );
      default:
        return <div></div>;
    }
  };

  return (
    <>
      <SettingsNav
        currentPage={page}
        showStyles={shouldShowStyles}
        onNavigate={(newPage) => navigate(newPage)}
      />
      {renderPage()}
    </>
  );
};
