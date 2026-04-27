import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

const FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
const INTERVAL = 80;

interface DotsSpinnerProps {
  size?: number;
  color?: string;
  style?: CSSProperties;
}

export function DotsSpinner({ size = 24, color = "#fff", style }: DotsSpinnerProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((i) => (i + 1) % FRAMES.length), INTERVAL);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      style={{
        alignItems: "center",
        display: "inline-flex",
        justifyContent: "center",
        ...style,
      }}
    >
      <span style={{ color, fontSize: size, lineHeight: `${size * 1.3}px`, textAlign: "center" }}>
        {FRAMES[frame]}
      </span>
    </span>
  );
}
