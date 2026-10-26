// NFR-OE-004: availability during scheduled exam windows, per calendar month (UTC).
// samples: [{ at: Date|string, up: boolean }] from an external probe of GET /api/health.
// windows: [{ startAt, endAt }] scheduled exam windows.
// A sample counts only if it falls inside at least one exam window.
export function availabilityByMonth(samples, windows, target = 99.5) {
  const ranges = windows.map((w) => [new Date(w.startAt).getTime(), new Date(w.endAt).getTime()]);
  const months = new Map();
  for (const sample of samples) {
    const at = new Date(sample.at).getTime();
    if (!ranges.some(([start, end]) => at >= start && at < end)) continue;
    const month = new Date(at).toISOString().slice(0, 7);
    const entry = months.get(month) ?? { month, samples: 0, up: 0 };
    entry.samples += 1;
    if (sample.up) entry.up += 1;
    months.set(month, entry);
  }
  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month)).map((entry) => {
    const availability = Math.round((entry.up / entry.samples) * 10_000) / 100;
    return { ...entry, availability, meetsTarget: availability >= target };
  });
}
