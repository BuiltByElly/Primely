import React from "react";

interface SpinnerProps {
  /**
   * Size of the spinner: 'sm' | 'md' | 'lg' | 'xl' | custom number (in pixels)
   * @default 'md'
   */
  size?: "sm" | "md" | "lg" | "xl" | number;

  /**
   * Tailwind classes for the outer (background) ring
   * @default "border-neutral-lighter"
   */
  outerClassName?: string;

  /**
   * Tailwind classes for the inner (animated) ring
   * @default "border-t-primary"
   */
  innerClassName?: string;

  /**
   * Animation speed: 'slow' | 'normal' | 'fast'
   * @default 'normal'
   */
  speed?: "slow" | "normal" | "fast";

  thickness?: number;
  trackClassName?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  outerClassName = "bg-background",
  trackClassName = "bg-neutral-lighter",
  innerClassName = "border-t-primary",
  speed = "normal",
  thickness = 10,
}) => {
  const sizeMap: Record<string, number> = {
    sm: 24,
    md: 40,
    lg: 64,
    xl: 96,
  };

  const speedMap: Record<string, number> = {
    slow: 2,
    normal: 1,
    fast: 0.6,
  };

  const actualSize =
    typeof size === "number" ? size : sizeMap[size] || sizeMap.md;
  const duration = speedMap[speed];
  const actualThickness = thickness / 2;

  return (
    <div
      className={`track rounded-full ${trackClassName} relative`}
      style={{
        width: `${actualSize}px`,
        height: `${actualSize}px`,
      }}
    >
      <div
        className={`absolute top-1/2 left-1/2 ${outerClassName} -translate-x-1/2 -translate-y-1/2 rounded-full `}
        style={{
          width: `${actualSize - thickness}px`,
          height: `${actualSize - thickness}px`,
        }}
      />
      <div
        className={`rounded-full  inset-0  h-full border-transparent ${innerClassName} animate-spin`}
        style={{
          animationDuration: `${duration}s`,
          borderWidth: `${actualThickness}px`,
        }}
      />
    </div>
  );
};

export default Spinner;
