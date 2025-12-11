import * as React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  resetError: () => void;
}

/**
 * Error boundary component that catches React errors in the settings UI.
 * Follows React 18 best practices and provides a recovery mechanism.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={ErrorFallback}>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught.
   * This is called during the render phase.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error details for debugging.
   * This is called during the commit phase, so side effects are allowed.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console for development debugging
    console.error("Vale Settings Error Boundary caught an error:", error);
    console.error("Component stack:", errorInfo.componentStack);

    // Update state with additional error info
    this.setState({
      errorInfo,
    });

    // TODO: In production, you might want to send this to an error tracking service
    // For now, we just log to the console which is appropriate for an Obsidian plugin
  }

  /**
   * Reset the error boundary state, allowing the user to try again.
   */
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            resetError={this.resetError}
          />
        );
      }

      // Default fallback if no custom fallback is provided
      return (
        <div className="vale-error-boundary">
          <h3>Something went wrong</h3>
          <p>
            The Vale settings encountered an error. Please try reloading the
            settings.
          </p>
          <button onClick={this.resetError}>Try again</button>
          {this.state.error && (
            <details style={{ marginTop: "1em" }}>
              <summary>Error details</summary>
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
