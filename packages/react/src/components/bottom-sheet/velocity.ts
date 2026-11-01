// How far back, in milliseconds, a pointer's places count toward how fast it is moving, how long
// it has been still for when it has stopped, and how many of its places are kept: Android's
// velocity tracker's, which Compose's is on Android (VelocityTracker1D, Strategy.Impulse).
const horizon = 100
const stopped = 40
const history = 20

/** A pointer's velocity, in pixels a second along each axis. */
export type Velocity = { x: number; y: number }

// How fast a body of unit mass with `energy` moves, the way the energy went.
const speedOf = (energy: number) => Math.sign(energy) * Math.sqrt(2 * Math.abs(energy))

// How fast the places `values`, at `times` in milliseconds, oldest first, end up moving: Android's
// impulse strategy, the speed of a body the pointer has done the work on that each stretch of its
// path does, braking it with a stretch slower than it, and the first stretch's halved.
function impulse(times: number[], values: number[]) {
  let work = 0
  let first = true
  for (let i = 1; i < times.length; i++) {
    const time = times[i]! - times[i - 1]!
    if (!time) continue
    const speed = (values[i]! - values[i - 1]!) / time
    work += (speed - speedOf(work)) * Math.abs(speed)
    if (first) {
      work *= 0.5
      first = false
    }
  }
  return speedOf(work)
}

/**
 * Tracks how fast a pointer is moving from the places it is `add`ed at, as Android's velocity
 * tracker does: from its places over the last tenth of a second, as long as none is over 40ms
 * after the one before, the way it is moving at the last of them.
 */
export function trackVelocity() {
  let samples: [time: number, x: number, y: number][] = []
  return {
    /** Starts over, for a new drag. */
    reset() {
      samples = []
    },
    /** Notes where the pointer is now. */
    add(x: number, y: number) {
      samples.push([performance.now(), x, y])
      if (samples.length > history) samples.shift()
    },
    /** How fast it is moving now. */
    velocity(): Velocity {
      const newest = samples.at(-1)
      if (!newest) return { x: 0, y: 0 }
      // Its places back from the newest while it kept moving: within the horizon of the newest,
      // none over 40ms after the one before it.
      let from = samples.length - 1
      while (from > 0) {
        const [time] = samples[from - 1]!
        if (newest[0] - time > horizon || samples[from]![0] - time > stopped) break
        from--
      }
      const moving = samples.slice(from)
      if (moving.length < 2) return { x: 0, y: 0 }
      const times = moving.map((sample) => sample[0])
      const along = (axis: 1 | 2) =>
        impulse(
          times,
          moving.map((sample) => sample[axis]),
        ) * 1000 || 0
      return { x: along(1), y: along(2) }
    },
  }
}
