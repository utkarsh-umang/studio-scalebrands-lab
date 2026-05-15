/** Parse mm:ss, m:ss, or raw seconds into seconds (fractional seconds supported in last segment). */
export function parseTimeToSeconds(input: string): number | null {
  const t = input.trim()
  if (!t) return null
  const colon = t.match(/^(\d+):(\d{1,2}(?:\.\d+)?)$/)
  if (colon) {
    const min = Number.parseInt(colon[1], 10)
    const sec = Number.parseFloat(colon[2])
    if (Number.isNaN(min) || Number.isNaN(sec)) return null
    return min * 60 + sec
  }
  const n = Number.parseFloat(t)
  if (!Number.isNaN(n) && n >= 0) return n
  return null
}
