export const pct = (x: number) => `${Math.round(x * 100)}%`;

export const longDate = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

export const shortDate = (t: number) =>
  new Date(t).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

export function formatBytes(n: number | null): string {
  if (n == null) return 'Unknown';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 ** 3) return `${Math.round(n / 1024 / 1024)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}
