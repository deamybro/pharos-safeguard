"use client";

import { useEffect, useState } from "react";

export default function TerminalOutput({ lines }: { lines: string[] }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    setVisible(0);
    const timers = lines.map((_, index) => window.setTimeout(() => setVisible(index + 1), index * 50));
    return () => timers.forEach(window.clearTimeout);
  }, [lines]);

  return (
    <div className="min-h-64 overflow-hidden border border-border bg-[#050509] p-4 font-mono text-xs leading-6 text-[var(--risk-low)]">
      {lines.slice(0, visible).map((line, index) => (
        <div key={`${line}-${index}`}>&gt; {line}</div>
      ))}
    </div>
  );
}
