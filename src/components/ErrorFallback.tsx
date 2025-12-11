import * as React from "react";
import { ErrorFallbackProps } from "./ErrorBoundary";

/**
 * Error fallback component that displays when the settings UI encounters an error.
 * Uses Obsidian CSS variables for consistent styling with the Obsidian theme.
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div
      style={{
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        gap: "1rem",
      }}
    >
      {/* Error Icon */}
      <div
        style={{
          fontSize: "3rem",
          color: "var(--text-error)",
          marginBottom: "0.5rem",
        }}
      >
        ⚠️
      </div>

      {/* Error Title */}
      <h2
        style={{
          margin: 0,
          fontSize: "var(--font-ui-large)",
          color: "var(--text-normal)",
          fontWeight: "var(--font-semibold)",
        }}
      >
        Something went wrong
      </h2>

      {/* Error Description */}
      <p
        style={{
          margin: "0.5rem 0",
          fontSize: "var(--font-ui-medium)",
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: "400px",
        }}
      >
        The Vale settings encountered an unexpected error. This might be a
        temporary issue. Please try again.
      </p>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
        <button
          className="mod-cta"
          onClick={resetError}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>

        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            background: "var(--background-secondary)",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "var(--radius-s)",
            color: "var(--text-normal)",
          }}
        >
          {showDetails ? "Hide details" : "Show details"}
        </button>
      </div>

      {/* Error Details (Collapsible) */}
      {showDetails && error && (
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            marginTop: "1.5rem",
            padding: "1rem",
            background: "var(--background-secondary)",
            border: "1px solid var(--background-modifier-border)",
            borderRadius: "var(--radius-s)",
            overflow: "auto",
          }}
        >
          <h3
            style={{
              margin: "0 0 0.5rem 0",
              fontSize: "var(--font-ui-medium)",
              color: "var(--text-normal)",
              fontWeight: "var(--font-semibold)",
            }}
          >
            Error details
          </h3>

          {/* Error Name and Message */}
          <div
            style={{
              marginBottom: "1rem",
              padding: "0.75rem",
              background: "var(--background-primary)",
              border: "1px solid var(--background-modifier-border)",
              borderRadius: "var(--radius-s)",
              borderLeft: "3px solid var(--text-error)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-monospace)",
                fontSize: "var(--font-ui-small)",
                color: "var(--text-error)",
                fontWeight: "var(--font-semibold)",
                marginBottom: "0.25rem",
              }}
            >
              {error.name}
            </div>
            <div
              style={{
                fontFamily: "var(--font-monospace)",
                fontSize: "var(--font-ui-small)",
                color: "var(--text-normal)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {error.message}
            </div>
          </div>

          {/* Component Stack Trace */}
          {errorInfo?.componentStack && (
            <details>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: "var(--font-ui-small)",
                  color: "var(--text-muted)",
                  marginBottom: "0.5rem",
                  padding: "0.5rem",
                  background: "var(--background-primary)",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "var(--radius-s)",
                }}
              >
                Component stack trace
              </summary>
              <pre
                style={{
                  margin: "0.5rem 0 0 0",
                  padding: "0.75rem",
                  background: "var(--background-primary)",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "var(--radius-s)",
                  fontSize: "var(--font-ui-smaller)",
                  fontFamily: "var(--font-monospace)",
                  color: "var(--text-muted)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflow: "auto",
                  maxHeight: "200px",
                }}
              >
                {errorInfo.componentStack}
              </pre>
            </details>
          )}

          {/* Full Stack Trace */}
          {error.stack && (
            <details>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: "var(--font-ui-small)",
                  color: "var(--text-muted)",
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  background: "var(--background-primary)",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "var(--radius-s)",
                }}
              >
                Full stack trace
              </summary>
              <pre
                style={{
                  margin: "0.5rem 0 0 0",
                  padding: "0.75rem",
                  background: "var(--background-primary)",
                  border: "1px solid var(--background-modifier-border)",
                  borderRadius: "var(--radius-s)",
                  fontSize: "var(--font-ui-smaller)",
                  fontFamily: "var(--font-monospace)",
                  color: "var(--text-muted)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflow: "auto",
                  maxHeight: "200px",
                }}
              >
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Help Text */}
      <p
        style={{
          margin: "1.5rem 0 0 0",
          fontSize: "var(--font-ui-small)",
          color: "var(--text-faint)",
          textAlign: "center",
          maxWidth: "500px",
        }}
      >
        If this problem persists, please report it on the{" "}
        <a
          href="https://github.com/jsade/obsidian-vale/issues"
          className="link-hover-underline"
        >
          GitHub repository
        </a>{" "}
        with the error details shown above.
      </p>
    </div>
  );
};
