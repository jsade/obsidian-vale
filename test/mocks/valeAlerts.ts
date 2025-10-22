/**
 * Mock ValeAlert data for testing
 */

import { ValeAlert } from "../../src/types";

/**
 * Factory function to create a ValeAlert with sensible defaults
 */
export function createMockValeAlert(
  overrides: Partial<ValeAlert> = {}
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
    Span: [0, 7],
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
    Span: [0, 7],
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
    Span: [10, 18],
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
    Span: [20, 45],
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
    Span: [0, 10],
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
    Span: [5, 15],
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
    Span: [100, 110],
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
    Span: [0, 50],
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
 */
export function createSequentialAlerts(count: number): ValeAlert[] {
  const alerts: ValeAlert[] = [];
  let currentPos = 0;

  for (let i = 0; i < count; i++) {
    const matchLength = 5 + (i % 10); // Vary length from 5-14 chars
    alerts.push(
      createMockValeAlert({
        Check: `Vale.Test${i}`,
        Message: `Test alert ${i}`,
        Span: [currentPos, currentPos + matchLength],
        Match: `word${i}`,
        Line: Math.floor(i / 3) + 1, // ~3 alerts per line
      })
    );
    currentPos += matchLength + 5; // Add some spacing
  }

  return alerts;
}

/**
 * Creates alerts with overlapping positions
 * Useful for testing decoration conflict resolution
 */
export function createOverlappingAlerts(): ValeAlert[] {
  return [
    createMockValeAlert({
      Check: "Vale.Outer",
      Span: [0, 20],
      Match: "outer range match",
    }),
    createMockValeAlert({
      Check: "Vale.Inner",
      Span: [5, 15],
      Match: "inner match",
    }),
    createMockValeAlert({
      Check: "Vale.Partial",
      Span: [10, 25],
      Match: "partial overlap",
    }),
  ];
}

/**
 * Creates alerts of different severities
 */
export function createAlertsBySeverity(): {
  error: ValeAlert;
  warning: ValeAlert;
  suggestion: ValeAlert;
} {
  return {
    error: createMockValeAlert({
      Severity: "error",
      Span: [0, 5],
      Check: "Vale.Error",
    }),
    warning: createMockValeAlert({
      Severity: "warning",
      Span: [10, 15],
      Check: "Vale.Warning",
    }),
    suggestion: createMockValeAlert({
      Severity: "suggestion",
      Span: [20, 25],
      Check: "Vale.Suggestion",
    }),
  };
}

/**
 * Sample document text with corresponding alerts
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
      Span: [10, 17], // "example"
      Match: "example",
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
      Span: [179, 186], // "recieve"
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
      Span: [228, 236], // "although"
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
