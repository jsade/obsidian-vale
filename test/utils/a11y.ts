/**
 * Accessibility Testing Utilities
 *
 * These utilities enforce accessibility requirements defined in
 * docs/accessibility-requirements.md. Use them in component tests
 * to ensure WCAG 2.2 compliance.
 *
 * @module test/utils/a11y
 */

/**
 * Color contrast calculation utilities
 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse a color string to RGB values
 */
function parseColor(color: string): RGB | null {
  // Handle rgb() format
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Handle hex format
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  // Handle named colors (common subset)
  const namedColors: Record<string, RGB> = {
    white: { r: 255, g: 255, b: 255 },
    black: { r: 0, g: 0, b: 0 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
  };

  return namedColors[color.toLowerCase()] || null;
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(rgb: RGB): number {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const sRGB = val / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Assert that an element is keyboard accessible.
 *
 * Checks:
 * - Element is in tab order (tabIndex >= 0 or naturally focusable)
 * - Element can receive focus
 * - Element responds to Enter/Space if it's a button-like element
 *
 * @param element - The HTML element to test
 * @throws Error if element is not keyboard accessible
 *
 * @example
 * ```typescript
 * const button = screen.getByRole('button');
 * assertKeyboardAccessible(button);
 * ```
 */
export function assertKeyboardAccessible(element: HTMLElement): void {
  // Check if element is in tab order
  const tabIndex = element.getAttribute("tabindex");
  const isFocusable =
    element.tagName === "BUTTON" ||
    element.tagName === "A" ||
    element.tagName === "INPUT" ||
    element.tagName === "SELECT" ||
    element.tagName === "TEXTAREA" ||
    (tabIndex !== null && parseInt(tabIndex, 10) >= 0);

  if (!isFocusable) {
    throw new Error(
      `Element is not keyboard accessible. Add tabindex="0" or use a semantic element.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }

  // Check if element can actually receive focus
  const previousActiveElement = document.activeElement;
  element.focus();
  const didReceiveFocus = document.activeElement === element;

  // Restore previous focus
  if (previousActiveElement instanceof HTMLElement) {
    previousActiveElement.focus();
  }

  if (!didReceiveFocus && tabIndex !== "-1") {
    throw new Error(
      `Element cannot receive focus. Check if it's hidden or has pointer-events: none.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }

  // For button-like elements, check role
  const role = element.getAttribute("role");
  const hasButtonRole =
    element.tagName === "BUTTON" ||
    role === "button" ||
    role === "tab" ||
    role === "link";

  if (
    hasButtonRole &&
    element.tagName !== "BUTTON" &&
    element.tagName !== "A" &&
    element.tagName !== "INPUT"
  ) {
    console.warn(
      `Element has button-like role but is not a semantic button/link. ` +
        `Consider using <button> instead.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }
}

/**
 * Assert that an element has a visible focus indicator.
 *
 * Checks:
 * - Focus indicator is visible (outline or border)
 * - Focus indicator has minimum 2px width
 * - Focus indicator has 3:1 contrast ratio (if colors can be determined)
 *
 * @param element - The HTML element to test
 * @param minWidth - Minimum width of focus indicator in pixels (default: 2)
 * @throws Error if focus indicator is not visible or doesn't meet requirements
 *
 * @example
 * ```typescript
 * const button = screen.getByRole('button');
 * button.focus();
 * assertFocusVisible(button);
 * ```
 */
export function assertFocusVisible(
  element: HTMLElement,
  minWidth: number = 2,
): void {
  // Focus the element
  element.focus();

  if (document.activeElement !== element) {
    throw new Error(
      `Element must be focused to check focus visibility.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }

  const styles = window.getComputedStyle(element);

  // Check outline
  const outlineWidth = parseFloat(styles.outlineWidth);
  const outlineStyle = styles.outlineStyle;
  const outlineColor = styles.outlineColor;

  // Check border (as alternative to outline)
  const borderWidth = parseFloat(styles.borderWidth);
  const borderStyle = styles.borderStyle;
  const borderColor = styles.borderColor;

  const hasOutline =
    outlineStyle !== "none" &&
    outlineWidth >= minWidth &&
    outlineColor !== "transparent";
  const hasBorder =
    borderStyle !== "none" &&
    borderWidth >= minWidth &&
    borderColor !== "transparent";

  if (!hasOutline && !hasBorder) {
    throw new Error(
      `Element does not have a visible focus indicator. ` +
        `Add outline or border with minimum ${minWidth}px width.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...\n` +
        `Computed styles: outline: ${outlineWidth}px ${outlineStyle} ${outlineColor}, ` +
        `border: ${borderWidth}px ${borderStyle} ${borderColor}`,
    );
  }

  // Check minimum width
  const indicatorWidth = hasOutline ? outlineWidth : borderWidth;
  if (indicatorWidth < minWidth) {
    throw new Error(
      `Focus indicator is too thin (${indicatorWidth}px). Minimum is ${minWidth}px.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }

  // Note: Checking 3:1 contrast ratio for focus indicator is complex
  // as it requires comparing against adjacent colors. We provide a warning
  // instead of throwing an error.
  const backgroundColor = styles.backgroundColor;
  const focusColor = hasOutline ? outlineColor : borderColor;

  if (backgroundColor && focusColor) {
    const bgRGB = parseColor(backgroundColor);
    const focusRGB = parseColor(focusColor);

    if (bgRGB && focusRGB) {
      const contrast = getContrastRatio(bgRGB, focusRGB);
      if (contrast < 3) {
        console.warn(
          `Focus indicator contrast ratio is ${contrast.toFixed(2)}:1, ` +
            `which is below the recommended 3:1 minimum.\n` +
            `Element: ${element.outerHTML.slice(0, 100)}...\n` +
            `Background: ${backgroundColor}, Focus: ${focusColor}`,
        );
      }
    }
  }
}

/**
 * Assert that an element has an accessible name (label).
 *
 * Checks:
 * - Element has aria-label, aria-labelledby, or associated <label>
 * - For icon-only buttons, ensures accessible name exists
 * - Accessible name is not empty
 *
 * @param element - The HTML element to test
 * @param expectedName - Optional expected accessible name (for stricter testing)
 * @throws Error if element doesn't have an accessible name
 *
 * @example
 * ```typescript
 * const iconButton = screen.getByRole('button');
 * assertAriaLabeled(iconButton);
 * // Or with expected name
 * assertAriaLabeled(iconButton, 'Close settings');
 * ```
 */
export function assertAriaLabeled(
  element: HTMLElement,
  expectedName?: string,
): void {
  // Check for aria-label
  const ariaLabel = element.getAttribute("aria-label");

  // Check for aria-labelledby
  const ariaLabelledBy = element.getAttribute("aria-labelledby");
  let labelledByText = "";
  if (ariaLabelledBy) {
    const labelElement = document.getElementById(ariaLabelledBy);
    labelledByText = labelElement?.textContent?.trim() || "";
  }

  // Check for associated <label> (for form inputs)
  let associatedLabelText = "";
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    associatedLabelText = label?.textContent?.trim() || "";
  }

  // Check for text content (for buttons with visible text)
  const textContent = element.textContent?.trim() || "";

  // Check for title attribute (least preferred)
  const title = element.getAttribute("title");

  // Determine accessible name
  const accessibleName =
    ariaLabel ||
    labelledByText ||
    associatedLabelText ||
    textContent ||
    title ||
    "";

  if (!accessibleName) {
    throw new Error(
      `Element does not have an accessible name. Add aria-label, aria-labelledby, ` +
        `associated <label>, or text content.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }

  // If expected name is provided, verify it matches
  if (expectedName && accessibleName !== expectedName) {
    throw new Error(
      `Element's accessible name "${accessibleName}" does not match expected "${expectedName}".\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }

  // Warn if using title (it's not reliable for screen readers)
  if (
    !ariaLabel &&
    !ariaLabelledBy &&
    !associatedLabelText &&
    !textContent &&
    title
  ) {
    console.warn(
      `Element is using title attribute for accessible name. ` +
        `This is not reliable. Use aria-label instead.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }
}

/**
 * Assert that a screen reader announcement was made.
 *
 * Checks:
 * - Container has aria-live region
 * - Announcement text is present in the region
 * - Region has appropriate aria-live setting (polite or assertive)
 *
 * @param container - The container element (usually the component root)
 * @param expectedText - The text that should be announced
 * @param assertive - Whether the announcement should be assertive (default: false)
 * @throws Error if announcement region is not found or doesn't contain expected text
 *
 * @example
 * ```typescript
 * const { container } = render(<Component />);
 * fireEvent.click(screen.getByRole('button'));
 * assertScreenReaderAnnouncement(container, 'Settings saved successfully');
 * ```
 */
export function assertScreenReaderAnnouncement(
  container: HTMLElement,
  expectedText: string,
  assertive: boolean = false,
): void {
  // Find all aria-live regions
  const liveRegions = container.querySelectorAll(
    '[aria-live], [role="status"], [role="alert"]',
  );

  if (liveRegions.length === 0) {
    throw new Error(
      `No aria-live region found. Add an element with aria-live="polite" or role="status".\n` +
        `Expected announcement: "${expectedText}"`,
    );
  }

  // Check if any region contains the expected text
  let foundAnnouncement = false;
  let foundRegion: Element | null = null;

  for (const region of liveRegions) {
    const regionText = region.textContent?.trim() || "";
    if (regionText.includes(expectedText)) {
      foundAnnouncement = true;
      foundRegion = region;
      break;
    }
  }

  if (!foundAnnouncement) {
    const regionTexts = Array.from(liveRegions)
      .map((r) => r.textContent?.trim())
      .filter(Boolean);

    throw new Error(
      `Expected announcement "${expectedText}" not found in any aria-live region.\n` +
        `Found regions with text: ${JSON.stringify(regionTexts, null, 2)}`,
    );
  }

  // Verify aria-live setting
  if (foundRegion) {
    const ariaLive = foundRegion.getAttribute("aria-live");
    const role = foundRegion.getAttribute("role");

    const isAssertive = ariaLive === "assertive" || role === "alert";
    const isPolite = ariaLive === "polite" || role === "status";

    if (assertive && !isAssertive) {
      console.warn(
        `Expected assertive announcement but found polite. ` +
          `Use aria-live="assertive" or role="alert" for important announcements.\n` +
          `Region: ${foundRegion.outerHTML.slice(0, 100)}...`,
      );
    }

    if (!assertive && isAssertive) {
      console.warn(
        `Found assertive announcement but expected polite. ` +
          `Use aria-live="polite" or role="status" for non-critical announcements.\n` +
          `Region: ${foundRegion.outerHTML.slice(0, 100)}...`,
      );
    }

    if (!isAssertive && !isPolite) {
      console.warn(
        `aria-live region found but aria-live attribute is "${ariaLive}". ` +
          `Should be "polite" or "assertive".\n` +
          `Region: ${foundRegion.outerHTML.slice(0, 100)}...`,
      );
    }
  }
}

/**
 * Assert that element meets color contrast requirements.
 *
 * Checks:
 * - Text contrast ratio is at least the specified minimum
 * - Default: 4.5:1 for normal text, 3:1 for large text
 *
 * @param element - The HTML element to test
 * @param minimumRatio - Minimum contrast ratio (default: 4.5)
 * @throws Error if contrast ratio is below minimum
 *
 * @example
 * ```typescript
 * const heading = screen.getByRole('heading');
 * assertContrast(heading, 4.5); // Normal text
 *
 * const largeHeading = screen.getByRole('heading', { level: 1 });
 * assertContrast(largeHeading, 3); // Large text
 * ```
 */
export function assertContrast(
  element: HTMLElement,
  minimumRatio: number = 4.5,
): void {
  const styles = window.getComputedStyle(element);
  const color = styles.color;
  const backgroundColor = styles.backgroundColor;

  if (!color || !backgroundColor) {
    console.warn(
      `Cannot determine color or background color for element.\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
    return;
  }

  const colorRGB = parseColor(color);
  const bgRGB = parseColor(backgroundColor);

  if (!colorRGB || !bgRGB) {
    console.warn(
      `Cannot parse color values. Color: ${color}, Background: ${backgroundColor}\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
    return;
  }

  const contrast = getContrastRatio(colorRGB, bgRGB);

  if (contrast < minimumRatio) {
    throw new Error(
      `Insufficient color contrast: ${contrast.toFixed(2)}:1 (minimum: ${minimumRatio}:1)\n` +
        `Color: ${color}, Background: ${backgroundColor}\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...`,
    );
  }
}

/**
 * Assert that element meets touch target size requirements.
 *
 * Checks:
 * - Element is at least the specified size (default: 44x44px)
 * - WCAG 2.5.5 Target Size (Level AAA): 44x44px
 * - WCAG 2.5.8 Target Size (Minimum) (Level AA): 24x24px
 *
 * @param element - The HTML element to test
 * @param minimumSize - Minimum width/height in pixels (default: 44)
 * @throws Error if element is smaller than minimum size
 *
 * @example
 * ```typescript
 * const button = screen.getByRole('button');
 * assertTouchTarget(button, 44); // WCAG AAA
 * assertTouchTarget(button, 24); // WCAG AA
 * ```
 */
export function assertTouchTarget(
  element: HTMLElement,
  minimumSize: number = 44,
): void {
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  const styles = window.getComputedStyle(element);
  const paddingTop = parseFloat(styles.paddingTop);
  const paddingBottom = parseFloat(styles.paddingBottom);
  const paddingLeft = parseFloat(styles.paddingLeft);
  const paddingRight = parseFloat(styles.paddingRight);

  // Calculate effective touch target size (including padding)
  const effectiveWidth = width + paddingLeft + paddingRight;
  const effectiveHeight = height + paddingTop + paddingBottom;

  const meetsWidth = effectiveWidth >= minimumSize;
  const meetsHeight = effectiveHeight >= minimumSize;

  if (!meetsWidth || !meetsHeight) {
    throw new Error(
      `Touch target too small: ${effectiveWidth.toFixed(0)}x${effectiveHeight.toFixed(0)}px ` +
        `(minimum: ${minimumSize}x${minimumSize}px)\n` +
        `Element: ${element.outerHTML.slice(0, 100)}...\n` +
        `Tip: Add padding to increase effective touch target size.`,
    );
  }
}

/**
 * Assert that tab navigation works correctly.
 *
 * Checks:
 * - Tabs have role="tab"
 * - Tab container has role="tablist"
 * - Tab panels have role="tabpanel"
 * - aria-selected is set correctly
 * - aria-controls links tabs to panels
 * - Only selected tab is in tab order
 *
 * @param tablist - The tablist container element
 * @throws Error if tab navigation doesn't meet requirements
 *
 * @example
 * ```typescript
 * const tablist = screen.getByRole('tablist');
 * assertTabNavigation(tablist);
 * ```
 */
export function assertTabNavigation(tablist: HTMLElement): void {
  // Check tablist role
  const role = tablist.getAttribute("role");
  if (role !== "tablist") {
    throw new Error(
      `Tab container must have role="tablist". Found: ${role}\n` +
        `Element: ${tablist.outerHTML.slice(0, 100)}...`,
    );
  }

  // Check tablist has aria-label
  const ariaLabel = tablist.getAttribute("aria-label");
  const ariaLabelledBy = tablist.getAttribute("aria-labelledby");
  if (!ariaLabel && !ariaLabelledBy) {
    console.warn(
      `Tablist should have aria-label or aria-labelledby for screen readers.\n` +
        `Element: ${tablist.outerHTML.slice(0, 100)}...`,
    );
  }

  // Find all tabs
  const tabs = tablist.querySelectorAll('[role="tab"]');
  if (tabs.length === 0) {
    throw new Error(
      `No tabs found with role="tab" inside tablist.\n` +
        `Element: ${tablist.outerHTML.slice(0, 100)}...`,
    );
  }

  let selectedTabCount = 0;
  let tabsInTabOrder = 0;

  tabs.forEach((tab, index) => {
    const ariaSelected = tab.getAttribute("aria-selected");
    const tabIndex = tab.getAttribute("tabindex");
    const ariaControls = tab.getAttribute("aria-controls");

    // Check aria-selected
    if (ariaSelected !== "true" && ariaSelected !== "false") {
      throw new Error(
        `Tab ${index + 1} must have aria-selected="true" or "false". Found: ${ariaSelected}\n` +
          `Element: ${tab.outerHTML.slice(0, 100)}...`,
      );
    }

    if (ariaSelected === "true") {
      selectedTabCount++;
    }

    // Check tabIndex
    if (tabIndex === "0") {
      tabsInTabOrder++;
    }

    // Check aria-controls
    if (!ariaControls) {
      console.warn(
        `Tab ${index + 1} should have aria-controls pointing to its tabpanel.\n` +
          `Element: ${tab.outerHTML.slice(0, 100)}...`,
      );
    } else {
      // Verify tabpanel exists
      const tabpanel = document.getElementById(ariaControls);
      if (!tabpanel) {
        throw new Error(
          `Tab ${index + 1} aria-controls="${ariaControls}" but no element with that ID exists.\n` +
            `Element: ${tab.outerHTML.slice(0, 100)}...`,
        );
      }

      // Check tabpanel role
      const panelRole = tabpanel.getAttribute("role");
      if (panelRole !== "tabpanel") {
        throw new Error(
          `Element with id="${ariaControls}" must have role="tabpanel". Found: ${panelRole}\n` +
            `Element: ${tabpanel.outerHTML.slice(0, 100)}...`,
        );
      }

      // Check tabpanel aria-labelledby
      const panelLabelledBy = tabpanel.getAttribute("aria-labelledby");
      const tabId = tab.getAttribute("id");
      if (!panelLabelledBy) {
        console.warn(
          `Tabpanel should have aria-labelledby pointing to its tab.\n` +
            `Element: ${tabpanel.outerHTML.slice(0, 100)}...`,
        );
      } else if (tabId && panelLabelledBy !== tabId) {
        console.warn(
          `Tabpanel aria-labelledby="${panelLabelledBy}" should match tab id="${tabId}".\n` +
            `Element: ${tabpanel.outerHTML.slice(0, 100)}...`,
        );
      }
    }
  });

  // Verify exactly one tab is selected
  if (selectedTabCount !== 1) {
    throw new Error(
      `Exactly one tab must have aria-selected="true". Found: ${selectedTabCount}`,
    );
  }

  // Verify only one tab is in tab order (tabindex="0")
  if (tabsInTabOrder !== 1) {
    console.warn(
      `Only one tab should have tabindex="0" (roving tabindex pattern). Found: ${tabsInTabOrder}`,
    );
  }
}

/**
 * Assert that element has proper loading state indicators.
 *
 * Checks:
 * - Element or container has aria-busy attribute
 * - Loading announcement is present in aria-live region
 * - Element is disabled while loading (if applicable)
 *
 * @param element - The HTML element to test
 * @param isLoading - Whether element should be in loading state
 * @throws Error if loading state is not properly indicated
 *
 * @example
 * ```typescript
 * const button = screen.getByRole('button');
 * fireEvent.click(button);
 * assertLoadingState(button, true);
 * ```
 */
export function assertLoadingState(
  element: HTMLElement,
  isLoading: boolean,
): void {
  const ariaBusy = element.getAttribute("aria-busy");

  if (isLoading) {
    // Check aria-busy
    if (ariaBusy !== "true") {
      throw new Error(
        `Element should have aria-busy="true" when loading. Found: ${ariaBusy}\n` +
          `Element: ${element.outerHTML.slice(0, 100)}...`,
      );
    }

    // Check if button is disabled during loading
    if (element.tagName === "BUTTON") {
      const disabled = (element as HTMLButtonElement).disabled;
      if (!disabled) {
        console.warn(
          `Button should be disabled while loading to prevent multiple submissions.\n` +
            `Element: ${element.outerHTML.slice(0, 100)}...`,
        );
      }
    }

    // Check for loading announcement
    const parent = element.parentElement;
    if (parent) {
      const hasLoadingAnnouncement =
        parent.querySelector('[role="status"]') ||
        parent.querySelector("[aria-live]");
      if (!hasLoadingAnnouncement) {
        console.warn(
          `Loading state should have an aria-live region announcing the loading status.\n` +
            `Element: ${element.outerHTML.slice(0, 100)}...`,
        );
      }
    }
  } else {
    // Not loading - aria-busy should be false or absent
    if (ariaBusy === "true") {
      throw new Error(
        `Element should not have aria-busy="true" when not loading.\n` +
          `Element: ${element.outerHTML.slice(0, 100)}...`,
      );
    }
  }
}

/**
 * Assert that form input has proper error state.
 *
 * Checks:
 * - Input has aria-invalid when error is present
 * - Error message exists
 * - Error message is associated via aria-describedby
 * - Error message has role="alert" for immediate announcement
 *
 * @param input - The input element
 * @param hasError - Whether input should be in error state
 * @param errorMessage - Expected error message (optional)
 * @throws Error if error state is not properly indicated
 *
 * @example
 * ```typescript
 * const input = screen.getByLabelText('Vale path');
 * fireEvent.blur(input);
 * assertInputErrorState(input, true, 'File not found');
 * ```
 */
export function assertInputErrorState(
  input: HTMLElement,
  hasError: boolean,
  errorMessage?: string,
): void {
  const ariaInvalid = input.getAttribute("aria-invalid");
  const ariaDescribedBy = input.getAttribute("aria-describedby");

  if (hasError) {
    // Check aria-invalid
    if (ariaInvalid !== "true") {
      throw new Error(
        `Input should have aria-invalid="true" when in error state. Found: ${ariaInvalid}\n` +
          `Element: ${input.outerHTML.slice(0, 100)}...`,
      );
    }

    // Check aria-describedby
    if (!ariaDescribedBy) {
      throw new Error(
        `Input should have aria-describedby pointing to error message.\n` +
          `Element: ${input.outerHTML.slice(0, 100)}...`,
      );
    }

    // Find error message element
    const errorElement = document.getElementById(ariaDescribedBy);
    if (!errorElement) {
      throw new Error(
        `Input aria-describedby="${ariaDescribedBy}" but no element with that ID exists.\n` +
          `Element: ${input.outerHTML.slice(0, 100)}...`,
      );
    }

    // Check error message has role="alert"
    const role = errorElement.getAttribute("role");
    if (role !== "alert") {
      console.warn(
        `Error message should have role="alert" for immediate announcement. Found: ${role}\n` +
          `Element: ${errorElement.outerHTML.slice(0, 100)}...`,
      );
    }

    // If expected error message provided, verify it
    if (errorMessage) {
      const actualMessage = errorElement.textContent?.trim() || "";
      if (!actualMessage.includes(errorMessage)) {
        throw new Error(
          `Error message "${actualMessage}" does not contain expected "${errorMessage}"\n` +
            `Element: ${errorElement.outerHTML.slice(0, 100)}...`,
        );
      }
    }
  } else {
    // No error - aria-invalid should be false or absent
    if (ariaInvalid === "true") {
      throw new Error(
        `Input should not have aria-invalid="true" when no error is present.\n` +
          `Element: ${input.outerHTML.slice(0, 100)}...`,
      );
    }
  }
}

/**
 * Create a visually-hidden element for screen reader-only content.
 *
 * Use this utility to create content that is visible to screen readers
 * but hidden visually. This is useful for providing context that is
 * visually apparent but not programmatically available.
 *
 * Note: This function relies on the .sr-only CSS class defined in src/a11y.css.
 * Ensure that stylesheet is imported in your test setup or component styles.
 *
 * @param text - The text to make visually hidden
 * @returns HTMLElement with visually-hidden styling
 *
 * @example
 * ```typescript
 * const hiddenLabel = createVisuallyHidden('opens in new window');
 * linkElement.appendChild(hiddenLabel);
 * ```
 */
export function createVisuallyHidden(text: string): HTMLElement {
  const element = document.createElement("span");
  element.className = "sr-only";
  element.textContent = text;

  return element;
}

/**
 * Get all focusable elements within a container.
 *
 * Returns all elements that can receive keyboard focus, in tab order.
 *
 * @param container - The container element
 * @returns Array of focusable elements in tab order
 *
 * @example
 * ```typescript
 * const focusableElements = getFocusableElements(dialog);
 * const firstFocusable = focusableElements[0];
 * const lastFocusable = focusableElements[focusableElements.length - 1];
 * ```
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    "a[href], button:not([disabled]), textarea:not([disabled]), " +
    'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(selector),
  );

  // Filter out elements that are not visible
  return elements.filter((element) => {
    const styles = window.getComputedStyle(element);
    return (
      styles.display !== "none" &&
      styles.visibility !== "hidden" &&
      element.offsetParent !== null
    );
  });
}

/**
 * Simulate keyboard navigation through focusable elements.
 *
 * Useful for testing keyboard navigation in tests.
 *
 * @param container - The container element
 * @param key - The key to simulate ('Tab' or 'Shift+Tab')
 * @returns The newly focused element, or null if end of focus order
 *
 * @example
 * ```typescript
 * const dialog = screen.getByRole('dialog');
 * simulateKeyboardNavigation(dialog, 'Tab'); // Focus first element
 * simulateKeyboardNavigation(dialog, 'Tab'); // Focus second element
 * simulateKeyboardNavigation(dialog, 'Shift+Tab'); // Focus back to first
 * ```
 */
export function simulateKeyboardNavigation(
  container: HTMLElement,
  key: "Tab" | "Shift+Tab",
): HTMLElement | null {
  const focusableElements = getFocusableElements(container);
  const currentFocus = document.activeElement as HTMLElement;
  const currentIndex = focusableElements.indexOf(currentFocus);

  let nextIndex: number;
  if (key === "Tab") {
    nextIndex = currentIndex + 1;
    if (nextIndex >= focusableElements.length) {
      nextIndex = 0; // Wrap to first
    }
  } else {
    nextIndex = currentIndex - 1;
    if (nextIndex < 0) {
      nextIndex = focusableElements.length - 1; // Wrap to last
    }
  }

  const nextElement = focusableElements[nextIndex];
  if (nextElement) {
    nextElement.focus();
  }

  return nextElement || null;
}
