import type { ReactNode } from "react";

type SpinnerProps = {
  size?: number;
  color?: string;
  children?: ReactNode;
};

export default function Spinner({ size = 16, color = "currentColor", children }: SpinnerProps) {
  const indicator = (
      <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid ${color}`,
        borderTopColor: "transparent",
        borderRadius: "50%",
        animation: "ll-spin 0.7s linear infinite",
        flexShrink: 0,
       }}
     />
  );

  if (children === undefined) return indicator;

  return (
      <span role="status" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {indicator}
        {children}
      </span>
   );
}
