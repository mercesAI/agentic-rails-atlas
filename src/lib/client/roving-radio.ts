/**
 * Keyboard model of a radiogroup with roving tabindex (WAI-ARIA APG): Right and Down
 * select the next value, Left and Up the previous one, Home and End the first and last.
 * Returns null for any other key so the caller leaves the event alone.
 */
export function nextRadioValue<T>(values: readonly T[], current: T, key: string): T | null {
  const n = values.length;
  if (n === 0) return null;
  const i = Math.max(0, values.indexOf(current));
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return values[(i + 1) % n] ?? null;
    case 'ArrowLeft':
    case 'ArrowUp':
      return values[(i + n - 1) % n] ?? null;
    case 'Home':
      return values[0] ?? null;
    case 'End':
      return values[n - 1] ?? null;
    default:
      return null;
  }
}
