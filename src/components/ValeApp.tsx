import * as React from "react";
import { EventBus } from "../EventBus";
import { CheckInput, ValeAlert } from "../types";
import { ValeRunner } from "../vale/ValeRunner";
import { AlertList } from "./AlertList";
import { ErrorMessage } from "./ErrorMessage";
import { Icon } from "./Icon";
import { LoaderCube } from "./LoaderCube";

interface Props {
  runner: ValeRunner;
  eventBus: EventBus;
  onAlertClick: (alert: ValeAlert) => void;
}

interface CheckReport {
  results: ValeAlert[];
  errors?: React.ReactNode;
}

interface ErrorInfo {
  message: string;
  details?: string;
  showOnboarding: boolean;
}

/**
 * Categorizes Vale errors and returns user-friendly error messages
 * with actionable guidance.
 */
const categorizeError = (err: Error): ErrorInfo => {
  const errMessage = err.message;

  // Connection errors (Vale Server mode)
  if (errMessage === "net::ERR_CONNECTION_REFUSED") {
    return {
      message: "Couldn't connect to Vale Server.",
      details:
        "Make sure Vale Server is running and the server URL is correct in Settings.",
      showOnboarding: false,
    };
  }

  // Missing Vale binary or config - trigger onboarding
  if (errMessage === "Couldn't find vale") {
    return {
      message: "",
      showOnboarding: true,
    };
  }

  if (errMessage === "Couldn't find config") {
    return {
      message: "",
      showOnboarding: true,
    };
  }

  // Vale CLI errors with exit codes (format: "Vale exited with code X: stderr content")
  // Use [\s\S] instead of . with 's' flag for ES2018 compatibility
  const valeExitMatch = errMessage.match(
    /^Vale exited with code (\d+)(?:: ([\s\S]+))?$/,
  );
  if (valeExitMatch) {
    const exitCode = valeExitMatch[1];
    const stderrContent = valeExitMatch[2]?.trim();

    if (!stderrContent) {
      return {
        message: `Vale exited unexpectedly with code ${exitCode}.`,
        details:
          "No error details were provided by Vale. Check your Vale installation and configuration.",
        showOnboarding: false,
      };
    }

    // Categorize based on stderr content patterns

    // Configuration file errors
    if (
      stderrContent.includes(".vale.ini") ||
      stderrContent.includes("config") ||
      stderrContent.includes("Configuration")
    ) {
      return {
        message: "Vale configuration error",
        details: `${stderrContent}\n\nPlease check your Vale configuration file (.vale.ini) in Settings.`,
        showOnboarding: false,
      };
    }

    // Missing style packages
    if (
      stderrContent.includes("style") ||
      stderrContent.includes("StylesPath") ||
      stderrContent.includes("package")
    ) {
      return {
        message: "Missing Vale styles",
        details: `${stderrContent}\n\nYou may need to install Vale style packages. Go to Settings → Vale to configure styles.`,
        showOnboarding: false,
      };
    }

    // Permission errors
    if (
      stderrContent.toLowerCase().includes("permission denied") ||
      stderrContent.toLowerCase().includes("eacces")
    ) {
      return {
        message: "Permission error",
        details: `${stderrContent}\n\nThe Vale binary may not be executable. Try running: chmod +x /path/to/vale`,
        showOnboarding: false,
      };
    }

    // File not found errors
    if (
      stderrContent.toLowerCase().includes("no such file") ||
      stderrContent.toLowerCase().includes("enoent")
    ) {
      return {
        message: "Vale file not found",
        details: `${stderrContent}\n\nVerify that your Vale binary path is correct in Settings.`,
        showOnboarding: false,
      };
    }

    // Generic Vale error - show stderr content
    return {
      message: `Vale error (exit code ${exitCode})`,
      details: `${stderrContent}\n\nCheck your Vale configuration in Settings.`,
      showOnboarding: false,
    };
  }

  // Unknown error - show full error message
  return {
    message: "Something went wrong",
    details: `${err.toString()}\n\nIf this problem persists, check your Vale configuration in Settings.`,
    showOnboarding: false,
  };
};

export const ValeApp = ({
  runner,
  eventBus,
  onAlertClick,
}: Props): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const [highlightAlert, setHighlightAlert] = React.useState<ValeAlert>();
  const [showOnboarding, setShowOnboarding] = React.useState(false);

  const [report, setReport] = React.useState<CheckReport>();

  const check = async (
    input: CheckInput,
    checked: (cb: () => void) => void,
  ) => {
    const { text, format } = input;

    checked(() => {
      setShowOnboarding(false);
      setLoading(true);
      setReport(undefined);
    });

    return runner
      .run(text, format)
      .then((response) => {
        checked(() => {
          const results = Object.values(response)[0] ?? [];
          setReport({ ...report, results: results });
          eventBus.dispatch("alerts", results);
        });
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          const errorInfo = categorizeError(err);

          if (errorInfo.showOnboarding) {
            setShowOnboarding(true);
          } else {
            checked(() =>
              setReport({
                results: [],
                errors: (
                  <ErrorMessage
                    message={errorInfo.message}
                    details={errorInfo.details}
                  />
                ),
              }),
            );
          }
        } else {
          // Handle non-Error objects by safely converting to string
          const errorMessage = typeof err === "string" ? err : String(err);
          checked(() =>
            setReport({
              results: [],
              errors: <ErrorMessage message={errorMessage} />,
            }),
          );
        }
      })
      .finally(() => {
        checked(() => {
          setLoading(false);
        });
      });
  };

  // Highlight the alert whenever the users selects a text marker.
  React.useEffect(() => {
    const unr = eventBus.on("select-alert", (alert: ValeAlert) => {
      setHighlightAlert(alert);
    });

    const unr2 = eventBus.on("deselect-alert", () => {
      setHighlightAlert(undefined);
    });

    return () => {
      unr();
      unr2();
    };
  }, [report]);

  // Run the actual check.
  React.useEffect(() => {
    let cancel = false;

    const off = (cb: () => void) => {
      if (cancel) return;
      cb();
    };

    const unregister = eventBus.on("check", (input: CheckInput): void => {
      void check(input, off);
    });

    // Signal that the view is ready to check the document.
    eventBus.dispatch("ready", true);

    return () => {
      unregister();
      cancel = true;
    };
  }, [eventBus]);

  if (loading) {
    return <LoaderCube />;
  }

  if (!report) {
    return <div></div>;
  }

  if (report.errors) {
    return (
      <>
        <h4>Something went wrong ...</h4>
        {report.errors}
      </>
    );
  }

  if (showOnboarding) {
    return <Onboarding />;
  }

  if (report.results.length) {
    return (
      <AlertList
        alerts={report.results}
        highlight={highlightAlert}
        onClick={onAlertClick}
      />
    );
  }

  return (
    <div className="success">
      <Icon className="success-icon" name="check-in-circle" size={72} />
      <div className="success-text">{randomEncouragement()}</div>
    </div>
  );
};

const randomEncouragement = () => {
  const phrases = ["Nice! 👌", "You're awesome! 💪", "You did it! 🙌"];
  return phrases[Math.floor(Math.random() * phrases.length)];
};

const Onboarding = () => {
  return (
    <div className="card">
      <h2 style={{ textAlign: "center" }}>Configure Vale</h2>
      <p>
        This plugin is a graphical interface for{" "}
        <a href="https://docs.errata.ai/">Vale</a>.
      </p>
      <p>
        To check your document, you first need to configure where to find Vale.
      </p>
      <ol>
        <li>
          {"Go to "}
          <strong>Preferences</strong>
          {" -> "}
          <strong>Plugin options</strong>
          {" -> "}
          <strong>Vale</strong>
          {" to configure Vale."}
        </li>
        <li>
          {"Run the "}
          <strong>Check document</strong>
          {" command again when you're done."}
        </li>
      </ol>
    </div>
  );
};
