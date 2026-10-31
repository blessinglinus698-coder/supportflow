import { useTheme } from "../../context/ThemeContext";

// A fixed, decorative scene for the "Ocean Bed" theme: a few fish drifting
// past at different depths, seaweed swaying along the bottom, and bubbles
// rising. Everything here is pointer-events: none and sits behind the real
// app content (see App.tsx, where the layout wrapper is given a higher
// z-index), so it can never cover or interfere with the CRM's data — it's
// purely ambient, like looking through the glass of an aquarium.

interface FishConfig {
  top: string; // vertical position (depth) on screen
  size: number; // px, scales the whole fish
  duration: number; // seconds to cross the screen
  delay: number; // seconds, staggers the fish so they don't swim in sync
  bobDuration: number;
  tailDuration: number;
  opacity: number;
  flip?: boolean; // mirrors the fish so not all of them face the same way
}

const FISH: FishConfig[] = [
  { top: "18%", size: 82, duration: 34, delay: 0, bobDuration: 4.2, tailDuration: 1.1, opacity: 0.62 },
  { top: "62%", size: 56, duration: 26, delay: 8, bobDuration: 3.4, tailDuration: 0.9, opacity: 0.5, flip: true },
  { top: "40%", size: 108, duration: 46, delay: 15, bobDuration: 5.6, tailDuration: 1.4, opacity: 0.45 },
  { top: "78%", size: 44, duration: 22, delay: 3, bobDuration: 2.8, tailDuration: 0.8, opacity: 0.55 },
];

interface SeaweedConfig {
  left: string;
  height: number;
  duration: number;
  delay: number;
  opacity: number;
}

const SEAWEED: SeaweedConfig[] = [
  { left: "2%", height: 100, duration: 5.5, delay: 0.2, opacity: 0.42 },
  { left: "6%", height: 150, duration: 6.5, delay: 0, opacity: 0.5 },
  { left: "10%", height: 90, duration: 5, delay: 0.9, opacity: 0.36 },
  { left: "15%", height: 130, duration: 7, delay: 1.5, opacity: 0.44 },
  { left: "79%", height: 110, duration: 6, delay: 0.5, opacity: 0.4 },
  { left: "84%", height: 160, duration: 7.5, delay: 1.2, opacity: 0.46 },
  { left: "90%", height: 95, duration: 5.2, delay: 0.3, opacity: 0.35 },
  { left: "96%", height: 135, duration: 6.8, delay: 1.8, opacity: 0.4 },
];

interface BubbleConfig {
  left: string;
  size: number;
  duration: number;
  delay: number;
}

const BUBBLES: BubbleConfig[] = [
  { left: "8%", size: 6, duration: 11, delay: 0 },
  { left: "22%", size: 4, duration: 9, delay: 3 },
  { left: "47%", size: 7, duration: 13, delay: 6 },
  { left: "63%", size: 5, duration: 10, delay: 1.5 },
  { left: "80%", size: 4, duration: 8, delay: 4.5 },
  { left: "91%", size: 6, duration: 12, delay: 2.2 },
];

function Fish({ top, size, duration, delay, bobDuration, tailDuration, opacity, flip }: FishConfig) {
  return (
    <div
      className="ocean-fish"
      style={{
        top,
        opacity,
        animationDuration: `${duration}s`,
        animationDelay: `-${delay}s`,
      }}
    >
      <div
        className="ocean-fish__bob"
        style={{
          animationDuration: `${bobDuration}s`,
          transform: flip ? "scaleX(-1)" : undefined,
        }}
      >
        <svg width={size} height={size * 0.6} viewBox="0 0 50 30" fill="none">
          <path
            d="M2 15c6-10 22-12 30-6 2-3 6-5 10-5-2 4-2 7 0 11-4 0-8-2-10-5-8 6-24 4-30-6-1 4-1 7 0 11z"
            fill="#22d3ee"
            fillOpacity="0.55"
          />
          <path
            className="ocean-fish__tail"
            style={{ animationDuration: `${tailDuration}s` }}
            d="M2 15c-4-3-7-3-10-1 1 1 1 1 0 2 3 2 6 2 10-1z"
            fill="#67e8f9"
            fillOpacity="0.6"
          />
          <circle cx="30" cy="12" r="1.3" fill="#e4fbf7" fillOpacity="0.8" />
        </svg>
      </div>
    </div>
  );
}

function Seaweed({ left, height, duration, delay, opacity }: SeaweedConfig) {
  return (
    <svg
      className="ocean-seaweed"
      style={{ left, opacity, animationDuration: `${duration}s`, animationDelay: `-${delay}s` }}
      width={18}
      height={height}
      viewBox={`0 0 18 ${height}`}
      fill="none"
    >
      <path
        d={`M9 ${height} C 2 ${height * 0.75}, 16 ${height * 0.55}, 6 ${height * 0.3} C 1 ${height * 0.15}, 12 ${height * 0.08}, 9 0`}
        stroke="#2dd4bf"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Bubble({ left, size, duration, delay }: BubbleConfig) {
  return (
    <div
      className="ocean-bubble"
      style={{
        left,
        width: size,
        height: size,
        animationDuration: `${duration}s`,
        animationDelay: `-${delay}s`,
      }}
    />
  );
}

function OceanBackground() {
  const { theme } = useTheme();
  if (theme !== "ocean") return null;

  return (
    <div className="ocean-scene" aria-hidden="true">
      {SEAWEED.map((s, i) => (
        <Seaweed key={i} {...s} />
      ))}
      {BUBBLES.map((b, i) => (
        <Bubble key={i} {...b} />
      ))}
      {FISH.map((f, i) => (
        <Fish key={i} {...f} />
      ))}
    </div>
  );
}

export default OceanBackground;