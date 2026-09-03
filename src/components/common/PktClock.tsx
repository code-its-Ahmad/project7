import { memo, useEffect, useState } from 'react';

/**
 * Live Islamabad (PKT) clock.
 *
 * Extracted into its own memoised component for a concrete reason: it ticks
 * once per second, and while it lived inside `Hero` that tick re-rendered the
 * entire hero subtree — including the wrapper around the Three.js scene and the
 * four statistic cards — 60 times a minute, forever. Isolating the state means
 * only these few characters of text re-render.
 */
const PktClock = memo(() => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const format = () =>
      new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

    setTime(format());

    /*
     * Only minutes are displayed, so aligning the interval to the next minute
     * boundary replaces 60 wake-ups per minute with one, and keeps the displayed
     * minute accurate instead of drifting.
     */
    let intervalId: number | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);

    const timeoutId = window.setTimeout(() => {
      setTime(format());
      intervalId = window.setInterval(() => setTime(format()), 60_000);
    }, msToNextMinute);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, []);

  if (!time) return null;

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 font-mono text-[11px] text-cyan-300 backdrop-blur-md sm:text-xs">
      <span className="text-gray-400">Islamabad:</span>
      <time className="font-bold text-white">{time} PKT</time>
    </div>
  );
});

PktClock.displayName = 'PktClock';

export default PktClock;
