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

    // Categorize based on stderr content patterns (order matters - more specific patterns first)
    const stderrLower = stderrContent.toLowerCase();

    // Dictionary/spelling errors (dicpath resolution issues) - BEFORE generic style check
    // Note: "dictionary" is made more specific by excluding StylesPath errors
    if (
      stderrLower.includes("dicpath") ||
      stderrLower.includes("hunspell") ||
      (stderrLower.includes("unable to resolve") &&
        stderrLower.includes("spelling")) ||
      (stderrLower.includes("dictionary") &&
        !stderrLower.includes("stylespath"))
    ) {
      return {
        message: "Spelling dictionary not found",
        details: `${stderrContent}\n\nA Vale spelling style is looking for dictionary files that don't exist.\n\nTo fix this:\n1. Open Settings → Vale → Styles to see which spelling styles are enabled\n2. Each spelling style needs dictionary files (.dic and .aff) in your styles folder\n3. Check that the dictionary path in the style's config file is correct\n4. If files are missing, try reinstalling the style or check its documentation`,
        showOnboarding: false,
      };
    }

    // StylesPath directory not found
    if (
      stderrLower.includes("stylespath") &&
      (stderrLower.includes("does not exist") ||
        stderrLower.includes("not found") ||
        stderrLower.includes("no such"))
    ) {
      return {
        message: "Styles folder not found",
        details: `${stderrContent}\n\nVale is looking for a folder to store writing styles, but it doesn't exist yet.\n\nTo fix this:\n1. Open your .vale.ini config file (find its location in Settings → Vale)\n2. Look for the line starting with 'StylesPath ='\n3. Create that folder if it doesn't exist, or update the path to point to an existing folder\n\nExample: If your config says 'StylesPath = styles', create a folder named 'styles' next to your .vale.ini file.`,
        showOnboarding: false,
      };
    }

    // Configuration file errors
    if (
      stderrLower.includes(".vale.ini") ||
      stderrLower.includes("config") ||
      stderrLower.includes("configuration")
    ) {
      return {
        message: "Configuration file error",
        details: `${stderrContent}\n\nThere's a problem with your .vale.ini file.\n\nTo fix this:\n1. Open Settings → Vale and note your config file path\n2. Open the .vale.ini file in a text editor\n3. Check for common issues:\n   - Missing section headers like [*] or [*.md]\n   - Typos in setting names\n   - Invalid values or formatting\n\nIf using Custom mode, try switching to Managed mode in Settings → Vale to let the plugin create a fresh config.`,
        showOnboarding: false,
      };
    }

    // Style loading errors (individual style not found)
    if (
      stderrLower.includes("style") &&
      (stderrLower.includes("not found") ||
        stderrLower.includes("does not exist") ||
        stderrLower.includes("unable to load"))
    ) {
      return {
        message: "Writing style not found",
        details: `${stderrContent}\n\nA style listed in your config couldn't be found.\n\nTo fix this:\n1. Open Settings → Vale → Styles to see available styles\n2. Check that the style name matches exactly (names are case-sensitive)\n3. If the style isn't installed, enable it in the Styles tab\n4. Verify your styles folder contains the style directory`,
        showOnboarding: false,
      };
    }

    // Generic style/package errors (fallback for unmatched style issues)
    if (stderrLower.includes("style") || stderrLower.includes("package")) {
      return {
        message: "Style configuration error",
        details: `${stderrContent}\n\nThere's an issue with your Vale styles setup.\n\nTo fix this:\n1. Go to Settings → Vale → Styles to manage your styles\n2. Check that your styles folder exists and contains style directories\n3. Verify the styles listed in your config are installed`,
        showOnboarding: false,
      };
    }

    // Permission errors
    if (
      stderrLower.includes("permission denied") ||
      stderrLower.includes("eacces")
    ) {
      return {
        message: "Permission error",
        details: `${stderrContent}\n\nVale doesn't have permission to run on your system.\n\nTo fix this on Mac/Linux:\n1. Open Terminal\n2. Find your Vale path in Settings → Vale\n3. Run: chmod +x /path/to/your/vale\n\nTo fix this on Windows:\n1. Right-click the vale.exe file\n2. Select Properties → Security\n3. Ensure your user has "Read & Execute" permissions`,
        showOnboarding: false,
      };
    }

    // File not found errors
    if (
      stderrLower.includes("no such file") ||
      stderrLower.includes("enoent")
    ) {
      return {
        message: "Vale program not found",
        details: `${stderrContent}\n\nThe Vale program couldn't be found at the specified path.\n\nTo fix this:\n1. Open Settings → Vale\n2. If using Managed mode: Click "Download Vale" to reinstall\n3. If using Custom mode: Verify the path points to an existing vale (or vale.exe) file`,
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
