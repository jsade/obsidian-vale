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

  // Render the current page content with proper tabpanel ARIA attributes
  const renderPage = () => {
    switch (page) {
      case "General":
        return (
          <div
            role="tabpanel"
            id="panel-general"
            aria-labelledby="tab-general"
            tabIndex={0}
          >
            <GeneralSettings
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        );
      case "Styles":
        if (!shouldShowStyles) {
          // Show feedback when Styles tab is accessed but config path is invalid
          return (
            <div
              role="tabpanel"
              id="panel-styles"
              aria-labelledby="tab-styles"
              tabIndex={0}
              className="vale-settings-feedback"
            >
              <p>
                Configure a valid Vale config path in General settings to manage
                styles.
              </p>
            </div>
          );
        }
        return (
          <div
            role="tabpanel"
            id="panel-styles"
            aria-labelledby="tab-styles"
            tabIndex={0}
          >
            <StyleSettings settings={settings} navigate={navigate} />
          </div>
        );
      case "Rules":
        // Rules page doesn't use tab pattern (accessed via gear icon)
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
