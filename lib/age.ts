// Age (18+) helpers. Kept dependency-free so both the client form and the
// server zod schema can import them without pulling in unrelated code.

/** The latest date of birth that still counts as 18+ today (YYYY-MM-DD). */
export function maxAdultDob(now: Date = new Date()): string {
  const d = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** True when an ISO (YYYY-MM-DD) date of birth is at least 18 years ago. */
export function isAdultDob(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return iso <= maxAdultDob();
}
