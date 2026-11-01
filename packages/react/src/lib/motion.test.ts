import { describe, expect, it } from 'vitest'
import { ms } from './motion'

describe('ms', () => {
  it('reads a time in milliseconds, as the stylesheet writes a token', () => {
    expect(ms('450ms')).toBe(450)
    expect(ms('0.01ms')).toBe(0.01)
  })

  it('reads a time in seconds, as a minifier rewrites one', () => {
    expect(ms('.45s')).toBe(450)
    expect(ms('.2s')).toBe(200)
    expect(ms('1s')).toBe(1000)
  })

  it('reads a value as a custom property gives it, spaces and all, in either case', () => {
    expect(ms(' 200ms ')).toBe(200)
    expect(ms('200MS')).toBe(200)
  })

  it('gives the fallback for a value that is no time', () => {
    expect(ms('')).toBe(0)
    expect(ms('', 240)).toBe(240)
    expect(ms('450', 240)).toBe(240)
    expect(ms('var(--x)', 240)).toBe(240)
    expect(ms('1.2.3ms', 240)).toBe(240)
  })
})
