import { afterEach, describe, expect, it, vi } from 'vitest'
import { trackVelocity } from './velocity'

// The clock the tracker reads, set by the tests.
let now = 0
vi.spyOn(performance, 'now').mockImplementation(() => now)

/** A pointer moving at `speed` pixels a second down from `from` for `ms`, a place a frame. */
function move(tracker: ReturnType<typeof trackVelocity>, speed: number, ms: number, from = 0) {
  const start = now
  for (let t = 16; t <= ms; t += 16) {
    now = start + t
    tracker.add(0, from + (speed * t) / 1000)
  }
  return from + (speed * ms) / 1000
}

describe('trackVelocity', () => {
  afterEach(() => {
    now = 0
  })

  it('is 0 with one place, or places all at one time', () => {
    const tracker = trackVelocity()
    expect(tracker.velocity()).toEqual({ x: 0, y: 0 })
    tracker.add(0, 0)
    expect(tracker.velocity()).toEqual({ x: 0, y: 0 })
    tracker.add(0, 20)
    expect(tracker.velocity()).toEqual({ x: 0, y: 0 })
  })

  it('is the line through two places, and the speed of a pointer moving steadily', () => {
    const tracker = trackVelocity()
    tracker.add(0, 0)
    now = 16
    tracker.add(5, 20)
    expect(tracker.velocity()).toEqual({ x: 312.5, y: 1250 })
    tracker.reset()
    tracker.add(0, 0)
    move(tracker, 1000, 320)
    expect(tracker.velocity().y).toBeCloseTo(1000, 6)
  })

  it('reads the last tenth of a second alone, and a pointer speeding up at its latest', () => {
    const tracker = trackVelocity()
    tracker.add(0, 0)
    const at = move(tracker, 100, 480)
    move(tracker, 1000, 96, at)
    expect(tracker.velocity().y).toBeCloseTo(1000, 6)
    tracker.reset()
    for (let t = 0; t <= 192; t += 16) {
      now = t
      tracker.add(0, 0.01 * t * t)
    }
    // Over the chord of its last tenth of a second, 2880, toward its 3840 at the end.
    expect(tracker.velocity().y).toBeGreaterThan(2880)
    expect(tracker.velocity().y).toBeLessThan(3840)
  })

  it('is where a pointer that has turned back is going, not where it came from', () => {
    const tracker = trackVelocity()
    tracker.add(0, 0)
    const at = move(tracker, 1000, 320)
    move(tracker, -1000, 32, at)
    expect(tracker.velocity().y).toBeLessThan(-125)
  })

  it('is slowed by a pointer braking', () => {
    const tracker = trackVelocity()
    tracker.add(0, 0)
    const at = move(tracker, 1000, 320)
    move(tracker, 300, 64, at)
    expect(tracker.velocity().y).toBeGreaterThan(300)
    expect(tracker.velocity().y).toBeLessThan(500)
  })

  it('keeps the speed of a pointer let go of within 40ms of its last move, and past that has none', () => {
    const tracker = trackVelocity()
    tracker.add(0, 0)
    const at = move(tracker, 1000, 320)
    now += 40
    tracker.add(0, at)
    expect(tracker.velocity().y).toBeCloseTo(1000, 6)
    tracker.reset()
    tracker.add(0, 0)
    const again = move(tracker, 1000, 320)
    now += 41
    tracker.add(0, again)
    expect(tracker.velocity()).toEqual({ x: 0, y: 0 })
  })
})
