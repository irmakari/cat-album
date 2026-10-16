// "Oct 16, 2026"
export function formatSeenAt(seenAt: string) {
  return new Date(seenAt).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}
