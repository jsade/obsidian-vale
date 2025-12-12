/**
 * Mock ValeAlert data for testing
 */

import { ValeAlert } from "../../src/types";

/**
 * Factory function to create a ValeAlert with sensible defaults.
 *
 * NOTE: Vale uses 1-based positions for both Line and Span values.
 * - Line: 1-based line number (first line is 1)
 * - Span: [start, end] with 1-based byte offsets within the line
 *   (first character is position 1, not 0)
 */
export function createMockValeAlert(
  overrides: Partial<ValeAlert> = {},
): ValeAlert {
  return {
    Action: {
      Name: "replace",
      Params: ["example", "sample"],
    },
    Check: "Vale.Spelling",
    Description: "Use correct spelling",
    Line: 1,
    Link: "https://vale.sh",
    Message: "Did you really mean 'exampl'?",
    Severity: "error",
    Span: [1, 7], // 1-based: characters 1-6 (first 6 chars)
    Match: "exampl",
    ...overrides,
  };
}

/**
 * Pre-configured mock alerts for common test scenarios
 */
export const mockAlerts = {
  /**
   * Error-level spelling alert
   */
  spellingError: createMockValeAlert({
    Check: "Vale.Spelling",
    Message: "Did you really mean 'recieve'?",
    Severity: "error",
    Span: [1, 8], // 1-based: positions 1-7
    Match: "recieve",
    Action: {
      Name: "replace",
      Params: ["receive"],
    },
  }),

  /**
   * Warning-level style alert
   */
  styleWarning: createMockValeAlert({
    Check: "Google.WordList",
    Message: "Use 'though' instead of 'although'.",
    Severity: "warning",
    Span: [11, 19], // 1-based: positions 11-18
    Match: "although",
    Action: {
      Name: "replace",
      Params: ["though"],
    },
  }),

  /**
   * Suggestion-level readability alert
   */
  readabilitySuggestion: createMockValeAlert({
    Check: "Microsoft.Readability",
    Message: "Consider simplifying this phrase.",
    Severity: "suggestion",
    Span: [21, 46], // 1-based: positions 21-45
    Match: "in order to",
    Action: {
      Name: "replace",
      Params: ["to"],
    },
  }),

  /**
   * Alert with multiple suggestions
   */
  multipleSuggestions: createMockValeAlert({
    Check: "Vale.Terms",
    Message: "Use consistent terminology.",
    Severity: "warning",
    Span: [1, 11], // 1-based: positions 1-10
    Match: "JavaScript",
    Action: {
      Name: "replace",
      Params: ["JavaScript", "JS", "ECMAScript"],
    },
  }),

  /**
   * Alert with no suggestions
   */
  noSuggestions: createMockValeAlert({
    Check: "Vale.Avoid",
    Message: "Avoid using this phrase.",
    Severity: "error",
    Span: [6, 16], // 1-based: positions 6-15
    Match: "very unique",
    Action: {
      Name: "",
      Params: [],
    },
  }),

  /**
   * Alert on line 5
   */
  onLine5: createMockValeAlert({
    Line: 5,
    Span: [101, 111], // 1-based: positions 101-110
    Match: "utilize",
    Action: {
      Name: "replace",
      Params: ["use"],
    },
  }),

  /**
   * Long text match
   */
  longMatch: createMockValeAlert({
    Check: "Vale.Redundancy",
    Message: "Remove redundant phrase.",
    Span: [1, 51], // 1-based: positions 1-50
    Match:
      "This is a very long phrase that should be shortened for better readability",
    Action: {
      Name: "replace",
      Params: ["This phrase should be shorter"],
    },
  }),
};

/**
 * Creates a set of alerts with sequential positions
 * Useful for testing decoration ordering and mapping
 * NOTE: Alerts are positioned relative to their line, with ~3 alerts per line.
 * All Span values are 1-based to match Vale's output format.
 */
export function createSequentialAlerts(count: number): ValeAlert[] {
  const alerts: ValeAlert[] = [];

  for (let i = 0; i < count; i++) {
    const matchLength = 5 + (i % 10); // Vary length from 5-14 chars
    const lineNumber = Math.floor(i / 3) + 1; // ~3 alerts per line
    const posInLine = (i % 3) * 15 + 1; // 1-based position within line (1, 16, 31)

    alerts.push(
      createMockValeAlert({
        Check: `Vale.Test${i}`,
        Message: `Test alert ${i}`,
        Span: [posInLine, posInLine + matchLength], // 1-based positions
        Match: `word${i}`,
        Line: lineNumber,
      }),
    );
  }

  return alerts;
}

/**
 * Creates alerts with overlapping positions
 * Useful for testing decoration conflict resolution.
 * All Span values are 1-based to match Vale's output format.
 */
export function createOverlappingAlerts(): ValeAlert[] {
  return [
    createMockValeAlert({
      Check: "Vale.Outer",
      Span: [1, 21], // 1-based: positions 1-20
      Match: "outer range match",
    }),
    createMockValeAlert({
      Check: "Vale.Inner",
      Span: [6, 16], // 1-based: positions 6-15
      Match: "inner match",
    }),
    createMockValeAlert({
      Check: "Vale.Partial",
      Span: [11, 26], // 1-based: positions 11-25
      Match: "partial overlap",
    }),
  ];
}

/**
 * Creates alerts of different severities.
 * All Span values are 1-based to match Vale's output format.
 */
export function createAlertsBySeverity(): {
  error: ValeAlert;
  warning: ValeAlert;
  suggestion: ValeAlert;
} {
  // For document "error warning suggestion" (24 chars)
  return {
    error: createMockValeAlert({
      Severity: "error",
      Span: [1, 5], // 1-based: "error" (0-4, 5 chars)
      Check: "Vale.Error",
    }),
    warning: createMockValeAlert({
      Severity: "warning",
      Span: [7, 13], // 1-based: "warning" (6-12, 7 chars)
      Check: "Vale.Warning",
    }),
    suggestion: createMockValeAlert({
      Severity: "suggestion",
      Span: [15, 24], // 1-based: "suggestion" (14-23, 10 chars)
      Check: "Vale.Suggestion",
    }),
  };
}

/**
 * Sample document text with corresponding alerts.
 * All Span values are 1-based to match Vale's output format.
 */
export const sampleDocument = {
  text: `This is a example document for testing Vale integration.
It has several lines with intentional errors.
We will use this to test the decoration system.
Make sure to recieve feedback on your writing.
Sometimes we use although when though would be better.`,

  alerts: [
    createMockValeAlert({
      Line: 1,
      Span: [9, 18], // 1-based: positions 9-17 ("a example")
      Match: "a example",
      Check: "Vale.Articles",
      Message: "Use 'an example' instead of 'a example'.",
      Severity: "error",
      Action: {
        Name: "replace",
        Params: ["an example"],
      },
    }),
    createMockValeAlert({
      Line: 4,
      Span: [14, 21], // 1-based: positions 14-20 ("recieve")
      Match: "recieve",
      Check: "Vale.Spelling",
      Message: "Did you really mean 'recieve'?",
      Severity: "error",
      Action: {
        Name: "replace",
        Params: ["receive"],
      },
    }),
    createMockValeAlert({
      Line: 5,
      Span: [18, 26], // 1-based: positions 18-25 ("although")
      Match: "although",
      Check: "Google.WordList",
      Message: "Use 'though' instead of 'although'.",
      Severity: "warning",
      Action: {
        Name: "replace",
        Params: ["though"],
      },
    }),
  ],
};
