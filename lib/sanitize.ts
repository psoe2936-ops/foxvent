export function sanitizeText(input: string, maxLength: number): string {
  return input
    .trim()
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLength)
}

export function sanitizePrice(input: number): number {
  const val = Math.max(0, input)
  return Math.min(Math.round(val * 100) / 100, 999_999_999)
}

export function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, 30)
}
