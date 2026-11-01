/**
 * Milliseconds of a CSS time, as a motion token's custom property holds it: `450ms`, or `.45s`
 * once a minifier has rewritten it. A value that is no time, or none at all, is `fallback`.
 */
export function ms(value: string, fallback = 0) {
  const [, number, unit] = /^([\d.]+)(ms|s)$/i.exec(value.trim()) ?? []
  const time = Number(number)
  if (!unit || !Number.isFinite(time)) return fallback
  return unit.toLowerCase() === 's' ? time * 1000 : time
}
