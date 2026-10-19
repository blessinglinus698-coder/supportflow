import { useState, useEffect } from "react";

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div>
      <p style={{ fontSize: 19, fontWeight: 800, color: "var(--color-text)" }}>{timeStr}</p>
      <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 2 }}>{dateStr}</p>
    </div>
  );
}

export default LiveClock;