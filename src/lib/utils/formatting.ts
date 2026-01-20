/**
 * Format minutes into "Xh Ym" string.
 * e.g. 80 -> "1h 20m", 30 -> "30m"
 */
export function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0 && m === 0) return '0m';
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
