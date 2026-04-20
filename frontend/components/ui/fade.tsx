import * as React from "react";
import { cn } from "../../lib/utils";

type FadeProps = {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  duration?: number;
};

export function Fade({ show, children, className, duration = 200 }: FadeProps) {
  return (
    <div
      className={cn(
        "transition-opacity",
        show ? "opacity-100" : "opacity-0 pointer-events-none",
        className,
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}