import { setIcon } from "obsidian";
import * as React from "react";

interface Props {
  name: string;

  onClick?: () => void;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export const Icon = ({
  name,
  onClick,
  size = 16,
  className,
  ariaLabel,
}: Props): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (ref.current) {
      setIcon(ref.current, name);
    }
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  // If icon is decorative (no onClick), mark as aria-hidden
  if (!onClick) {
    return (
      <div
        className={className}
        ref={ref}
        style={{
          width: size,
          height: size,
        }}
        aria-hidden="true"
      />
    );
  }

  // If icon is interactive, make it keyboard accessible
  return (
    <div
      className={className}
      ref={ref}
      style={{
        width: size,
        height: size,
      }}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
    />
  );
};
