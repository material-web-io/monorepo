import { describe, expect, it, vi } from 'vitest'
import { circularOutline, linearOutline } from './geometry'
import {
  accelerateDecelerate,
  amplitudeFor,
  change,
  changeThreshold,
  circularCycle,
  circularPhaseAt,
  cubicBezier,
  emphasizedAccelerate,
  frameOf,
  frameStep,
  handover,
  linearCycle,
  linearCyclePhaseAt,
  linearIndeterminate,
  linearInkGone,
  linearWavePhase,
  phaseAt,
  standard,
  sweepAt,
  turnAt,
  waveArc,
  waveFrom,
  wavePeriod,
  waveUntil,
} from './motion'

/* The math behind the outlines and the cycles, which needs no browser. */

const numbers = (d: string) => (d.match(/-?[\d.]+/g) ?? []).map(Number)
const commands = (d: string) => d.replace(/[\d.\s-]+/g, '')

/** Points along the curves of a path, a number of them to a curve: where its outline really goes. */
function pointsOf(d: string, per = 8) {
  const points: [number, number][] = []
  let at: [number, number] = [0, 0]
  for (const [, command, rest] of d.matchAll(/([MCZ])([^MCZ]*)/g)) {
    const v = numbers(rest!)
    if (command === 'M') at = [v[0]!, v[1]!]
    if (command !== 'C') continue
    for (let i = 0; i <= per; i++) {
      const [t, u] = [i / per, 1 - i / per]
      const along = (a: number, b: number, c: number, e: number) =>
        u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * e
      points.push([along(at[0], v[0]!, v[2]!, v[4]!), along(at[1], v[1]!, v[3]!, v[5]!)])
    }
    at = [v[4]!, v[5]!]
  }
  return points
}

const extent = (d: string) => {
  const points = pointsOf(d)
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const round = (v: number) => Math.round(v * 100) / 100
  return {
    left: round(Math.min(...xs)),
    right: round(Math.max(...xs)),
    top: round(Math.min(...ys)),
    bottom: round(Math.max(...ys)),
  }
}

describe('easings', () => {
  it('are the M3 curves, with their ends and middles where CSS puts them', () => {
    expect(standard(0)).toBe(0)
    expect(standard(1)).toBe(1)
    expect(standard(0.5)).toBeCloseTo(0.878, 2)
    expect(emphasizedAccelerate(0.5)).toBeCloseTo(0.16, 1)
    expect(cubicBezier(0.42, 0, 1, 1)(0.5)).toBeCloseTo(0.315, 2)
  })
})

describe('linear outlines', () => {
  it('span the stroke and its caps, and the wave on top of it', () => {
    const flat = extent(linearOutline({ from: 2, to: 118, thickness: 4, y: 5, nodes: 2 }))
    expect(flat).toEqual({ left: 0, right: 120, top: 3, bottom: 7 })
    const wavy = extent(
      linearOutline({
        from: 2,
        to: 238,
        thickness: 4,
        y: 5,
        wave: { amplitude: 3, wavelength: 40, phase: 0 },
        nodes: 37,
      }),
    )
    // A round cap on a sloped stroke reaches a shade less far than the box.
    expect(wavy.left).toBeCloseTo(0, 0)
    expect(wavy.right).toBeCloseTo(240, 0)
    expect(wavy.top).toBeCloseTo(0, 0)
    expect(wavy.bottom).toBeCloseTo(10, 0)
  })

  it('are drawn in the same curves at every length, so that one can become another', () => {
    const at = (to: number) =>
      commands(
        linearOutline({
          from: 2,
          to,
          thickness: 4,
          y: 5,
          wave: { amplitude: 3, wavelength: 40, phase: 0.3 },
          nodes: 37,
        }),
      )
    expect(at(2)).toBe(at(100))
    expect(at(100)).toBe(at(238))
  })

  it('keep their nodes on a grid along the track with a wave, the ends travelling alone', () => {
    const wave = { amplitude: 3, wavelength: 40, phase: 0 }
    const at = (from: number, to: number) =>
      numbers(linearOutline({ from, to, thickness: 4, y: 5, wave, nodes: 39, grid: 40 / 6 }))
    // The outer edge's curve ends, each a half thickness off its node along the wave's
    // normal: a stroke from 2 to 50 has nodes at 2, every 6.67 from the first past it, and
    // 50, where the rest are gathered; a longer one keeps every node of the shorter where it was.
    const ends = (d: number[]) =>
      d
        .slice(2)
        .filter((_, i) => i % 6 === 4)
        .slice(0, 10)
    const xs = ends(at(2, 50))
    expect(xs.slice(7)).toEqual([50, 50, 50])
    for (const [i, x] of xs.slice(0, 7).entries()) expect(x).toBeCloseTo(6.67 * (i + 1), -1)
    const longer = ends(at(2, 90))
    expect(longer.slice(0, 7)).toEqual(xs.slice(0, 7))
    expect(longer[7]).not.toBe(50)
    expect(
      commands(
        linearOutline({ from: 2, to: 50, thickness: 4, y: 5, wave, nodes: 39, grid: 40 / 6 }),
      ),
    ).toBe(
      commands(
        linearOutline({ from: 2, to: 238, thickness: 4, y: 5, wave, nodes: 39, grid: 40 / 6 }),
      ),
    )
  })

  it('is a dot when it has no length', () => {
    const dot = extent(linearOutline({ from: 2, to: 2, thickness: 4, y: 5, nodes: 2 }))
    expect(dot).toEqual({ left: 0, right: 4, top: 3, bottom: 7 })
  })

  it('has round caps at both ends, every point of them half the thickness from the center line', () => {
    const d = linearOutline({ from: 10, to: 20, thickness: 4, y: 5, nodes: 3 })
    const caps = pointsOf(d).filter(([x]) => x < 10 || x > 20)
    expect(caps.length).toBeGreaterThan(20)
    for (const [x, y] of caps) expect(Math.hypot(x - (x < 10 ? 10 : 20), y - 5)).toBeCloseTo(2, 2)
    const dot = pointsOf(linearOutline({ from: 2, to: 2, thickness: 4, y: 5, nodes: 2 }))
    for (const [x, y] of dot) expect(Math.hypot(x - 2, y - 5)).toBeCloseTo(2, 2)
  })
})

describe('circular outlines', () => {
  it('reach from the top clockwise', () => {
    const quarter = extent(
      circularOutline({
        center: [24, 24],
        radius: 22,
        start: 0,
        sweep: Math.PI / 2,
        thickness: 4,
        nodes: 25,
      }),
    )
    expect(quarter.top).toBeCloseTo(0, 1)
    expect(quarter.right).toBeCloseTo(48, 1)
    expect(quarter.left).toBeCloseTo(22, 1)
  })
})

describe('the wave', () => {
  it('is drawn in past 10% of the progress and flattened again from 95%, as on Android', () => {
    expect(waveFrom).toBe(0.1)
    expect(waveUntil).toBe(0.95)
    expect(amplitudeFor(0)).toBe(0)
    expect(amplitudeFor(waveFrom)).toBe(0)
    expect(amplitudeFor(0.11)).toBe(1)
    expect(amplitudeFor(0.5)).toBe(1)
    expect(amplitudeFor(0.94)).toBe(1)
    expect(amplitudeFor(waveUntil)).toBe(0)
    expect(amplitudeFor(1)).toBe(0)
  })

  it('measures the full wave by its length, as Android cuts the drawn part by', () => {
    // A 3dp wave of 40dp wavelength is 5.7% longer than it is wide; near a crossing, where
    // it is steepest, a length along it falls short of the same distance across.
    const arc = waveArc(3, 40)
    expect(arc.scale).toBeCloseTo(1.0571, 4)
    expect(arc.inverse(120 * arc.scale)).toBeCloseTo(120, 6)
    expect(arc.inverse(2 * arc.scale)).toBeCloseTo(1.856, 3)
    expect(arc.inverse(10 * arc.scale)).toBeCloseTo(10, 6)
  })

  it('travels one wavelength a second, toward the start', () => {
    expect(Object.is(phaseAt(0), 0)).toBe(true)
    expect(phaseAt(wavePeriod)).toBe(-1)
    expect(phaseAt(wavePeriod / 4)).toBe(-0.25)
  })
})

describe('the indeterminate linear cycle', () => {
  const ease = emphasizedAccelerate

  it("is Android's: two lines crossing in turn over 1.75s, each end on the emphasized accelerate easing", () => {
    expect(linearCycle).toBe(1750)
    expect(linearIndeterminate(0)).toEqual([
      { from: 0, to: 0 },
      { from: 0, to: 0 },
    ])
    // The first head sets off at once and crosses in a second, its tail 250ms after it;
    // the second head at 650ms, crossing in 850, its tail at 900.
    expect(linearIndeterminate(500)).toEqual([
      { from: ease(0.25), to: ease(0.5) },
      { from: 0, to: 0 },
    ])
    expect(linearIndeterminate(1000)).toEqual([
      { from: ease(0.75), to: 1 },
      { from: ease(100 / 850), to: ease(350 / 850) },
    ])
    expect(linearIndeterminate(1250)[0]).toEqual({ from: 1, to: 1 })
    expect(linearIndeterminate(1500)[1].to).toBe(1)
    expect(linearIndeterminate(1749)[1].from).toBeLessThan(1)
  })

  it('ends with the second line gone and begins again with nothing drawn, keyed a frame apart', () => {
    const gone = { from: 1, to: 1 }
    expect(linearIndeterminate(linearCycle)).toEqual([gone, gone])
    expect(linearIndeterminate(linearCycle + 300)).toEqual(linearIndeterminate(300))
    expect(linearIndeterminate(-100)).toEqual(linearIndeterminate(1650))
    expect(linearInkGone).toBe(linearCycle)
    expect(frameStep).toBeCloseTo(16.667, 3)
  })

  it('has its wave travel a wavelength a second from where the recording has it against the cycle', () => {
    expect(linearWavePhase).toBe(0.7333)
    expect(linearCyclePhaseAt(0)).toBe(linearWavePhase)
    expect(linearCyclePhaseAt(250)).toBeCloseTo(linearWavePhase - 0.25, 6)
    expect(linearCyclePhaseAt(linearCycle + 250)).toBeCloseTo(linearCyclePhaseAt(250), 6)
  })
})

describe('a change of value', () => {
  it('settles from one progress into another on a critically damped spring, resting within a thousandth', () => {
    const move = change(0.2, 0.6)
    expect(move.at(0)).toBe(0.2)
    expect(move.velocityAt(0)).toBe(0)
    // Half-way after 240ms, and the last thousandth after 1.16s.
    expect(move.at(240)).toBeCloseTo(0.4, 2)
    expect(move.rest).toBe(1162)
    expect(Math.abs(move.at(move.rest - 1) - 0.6)).toBeGreaterThanOrEqual(changeThreshold)
    expect(Math.abs(move.at(move.rest - 1) - 0.6)).toBeLessThan(2 * changeThreshold)
    expect(move.at(move.rest)).toBe(0.6)
    expect(move.at(5000)).toBe(0.6)
    expect(move.velocityAt(5000)).toBe(0)
    expect(change(0.6, 0.2).at(240)).toBeCloseTo(0.4, 2)
  })

  it('carries the pace of a change it interrupts, so the progress neither stops nor jumps', () => {
    const first = change(0.2, 0.6)
    const second = change(first.at(100), 0.6, first.velocityAt(100))
    for (const t of [0, 50, 200, 600]) expect(second.at(t)).toBeCloseTo(first.at(100 + t), 9)
    const back = change(first.at(100), 0.1, first.velocityAt(100))
    expect(back.velocityAt(0)).toBeCloseTo(first.velocityAt(100), 9)
    expect(back.at(back.rest)).toBe(0.1)
  })

  it('is at rest at once when the value does not change, and never leaves 0 to 1', () => {
    expect(change(0.4, 0.4).rest).toBe(0)
    const fast = change(0.9, 1, 0.01)
    for (let t = 0; t <= fast.rest; t += 10) expect(fast.at(t)).toBeLessThanOrEqual(1)
  })
})

describe('the handover from indeterminate', () => {
  it("is timed from the cycle's end, when its lines have left, as the guideline video times it", () => {
    const [first, second] = linearIndeterminate(linearInkGone)
    expect(first.to - first.from).toBe(0)
    expect(second.to - second.from).toBe(0)
    expect(linearIndeterminate(linearInkGone - frameStep)[1].from).toBeLessThan(1)
    expect(handover).toEqual({
      dotDelay: 4 * frameStep,
      dotDuration: 13 * frameStep,
      fillDelay: 29 * frameStep,
    })
  })

  it('shrinks a circular arc on a half cosine, the Android default', () => {
    expect(accelerateDecelerate(0)).toBe(0)
    expect(accelerateDecelerate(0.25)).toBeCloseTo(0.1464, 4)
    expect(accelerateDecelerate(0.5)).toBeCloseTo(0.5, 9)
    expect(accelerateDecelerate(1)).toBe(1)
    expect(accelerateDecelerate(2)).toBe(1)
  })
})

describe('the indeterminate circular cycle', () => {
  it("is Android's: 6s, the drawing turned a quarter on so that the arc sets off from the right", () => {
    expect(circularCycle).toBe(6000)
    expect(turnAt(0)).toBe(90)
  })

  it('turns 180 degrees a second and a further 90 over 300ms from each quarter, evenly', () => {
    expect(turnAt(150)).toBeCloseTo(90 + 27 + 45, 9)
    expect(turnAt(300)).toBeCloseTo(90 + 54 + 90, 9)
    expect(turnAt(1500)).toBeCloseTo(90 + 270 + 90, 9)
    expect(turnAt(1800)).toBeCloseTo(90 + 324 + 180, 9)
    expect(turnAt(4800)).toBeCloseTo(90 + 864 + 360, 9)
    // Four turns a cycle, counted on without wrapping.
    expect(turnAt(6000)).toBeCloseTo(90 + 1440, 9)
    expect(turnAt(6150)).toBeCloseTo(turnAt(150) + 1440, 9)
  })

  it('draws the arc out from a tenth of a turn to 0.87 over 3s, evenly, and back on the standard easing', () => {
    expect(sweepAt(0)).toBe(0.1)
    expect(sweepAt(1500)).toBeCloseTo(0.485, 9)
    expect(sweepAt(3000)).toBeCloseTo(0.87, 9)
    expect(sweepAt(4500)).toBeCloseTo(0.87 - 0.77 * standard(0.5), 9)
    expect(sweepAt(6000)).toBeCloseTo(0.1, 9)
    expect(sweepAt(6300)).toBe(sweepAt(300))
  })

  it('has its star travel a point a second, half a point on from the cycle as the recording has it', () => {
    expect(circularPhaseAt(0)).toBe(-0.5)
    expect(circularPhaseAt(1000)).toBe(-1.5)
  })
})

describe('frames', () => {
  const linear = {
    kind: 'linear' as const,
    width: 240,
    thickness: 4,
    gap: 4,
    wave: null,
    track: true,
    stop: { size: 4, trailing: 0 },
  }

  it('keep the track a gap after the active indicator, and the stop indicator at the end', () => {
    const frame = frameOf(linear, { progress: 0.5, amplitude: 0, phase: 0 })
    expect(extent(frame.active)).toEqual({ left: 0, right: 122, top: 0, bottom: 4 })
    expect(extent(frame.track)).toEqual({ left: 126, right: 240, top: 0, bottom: 4 })
    expect(frame.stop).toBe('circle(2px at 238px 2px)')
  })

  it('draw a dot as the progress begins, and nothing before it', () => {
    const begun = frameOf(linear, { progress: 0.001, amplitude: 0, phase: 0 })
    expect(extent(begun.active)).toEqual({ left: 0, right: 4, top: 0, bottom: 4 })
    const none = frameOf(linear, { progress: 0, amplitude: 0, phase: 0 })
    expect(extent(none.active)).toEqual({ left: 2, right: 2, top: 2, bottom: 2 })
    expect(extent(none.track)).toEqual({ left: 0, right: 240, top: 0, bottom: 4 })
  })

  it("keep a flat indicator's stop indicator as it is, under the head, as Android does", () => {
    const whole = frameOf(linear, { progress: 1, amplitude: 0, phase: 0 })
    expect(whole.stop).toBe('circle(2px at 238px 2px)')
    expect(extent(whole.active)).toEqual({ left: 0, right: 240, top: 0, bottom: 4 })
    const thick = { ...linear, thickness: 8, stop: { size: 4, trailing: 2 } }
    const at = (progress: number) => frameOf(thick, { progress, amplitude: 0, phase: 0 }).stop
    expect(at(0.5)).toBe('circle(2px at 236px 4px)')
    expect(at(230 / 240)).toBe('circle(2px at 236px 4px)')
    expect(at(1)).toBe('circle(2px at 236px 4px)')
    const wide = { ...linear, thickness: 20, stop: { size: 4, trailing: 6 } }
    expect(frameOf(wide, { progress: 1, amplitude: 0, phase: 0 }).stop).toBe(
      'circle(2px at 232px 10px)',
    )
  })

  it("end a flat indicator's track as a dot under the stop indicator, then drop it", () => {
    // The track starts a gap and a thickness past the head while that is short of the end.
    const at = (progress: number) =>
      extent(frameOf(linear, { progress, amplitude: 0, phase: 0 }).track)
    expect(at(0.96)).toEqual({ left: 236, right: 240, top: 0, bottom: 4 })
    expect(at(0.97)).toEqual({ left: 238, right: 238, top: 2, bottom: 2 })
    expect(at(1)).toEqual({ left: 238, right: 238, top: 2, bottom: 2 })
  })

  const wavy = { ...linear, wave: { amplitude: 3, wavelength: 40 } }

  it("shrink a wavy indicator's stop indicator from its start as the head reaches it", () => {
    const at = (progress: number) => frameOf(wavy, { progress, amplitude: 0, phase: 0 }).stop
    expect(at(0.5)).toBe('circle(2px at 238px 5px)')
    expect(at(234 / 240)).toBe('circle(2px at 238px 5px)')
    expect(at(236 / 240)).toBe('circle(1px at 239px 5px)')
    expect(at(1)).toBe('circle(0px at 242px 5px)')
    // Its track ends sooner than a flat one's, with no dot: nothing once the head is 8dp from the end.
    expect(extent(frameOf(wavy, { progress: 0.96, amplitude: 0, phase: 0 }).track)).toEqual({
      left: 238,
      right: 238,
      top: 5,
      bottom: 5,
    })
    // Before the head's cap fits, nothing is drawn either: Android cuts a part of no length.
    const begun = frameOf(wavy, { progress: 0.001, amplitude: 0, phase: 0 })
    expect(extent(begun.active)).toEqual({ left: 2, right: 2, top: 5, bottom: 5 })
    expect(extent(begun.track)).toEqual({ left: 0, right: 240, top: 3, bottom: 7 })
  })

  it('cut a wavy indicator out of the full wave by its length, so its ends move with the wave', () => {
    // At 50% of 240, three wavelengths, the head is where it would be flat; the tail's cap
    // starts 0.14dp short of the start. An eighth of a wavelength on, the head is 0.2dp short.
    const rest = frameOf(wavy, { progress: 0.5, amplitude: 1, phase: 0 })
    expect(extent(rest.active).right).toBeCloseTo(122, 6)
    expect(extent(rest.active).left).toBeCloseTo(-0.14, 2)
    const moved = frameOf(wavy, { progress: 0.5, amplitude: 1, phase: -0.125 })
    expect(extent(moved.active).right).toBeCloseTo(121.8, 1)
    // Flat, the wave is a line and the length is the distance.
    const flat = frameOf(wavy, { progress: 0.5, amplitude: 0, phase: -0.125 })
    expect(extent(flat.active)).toEqual({ left: 0, right: 122, top: 3, bottom: 7 })
    expect(extent(flat.track)).toEqual({ left: 126, right: 240, top: 3, bottom: 7 })
  })

  it('pop the stop indicator in by its share', () => {
    const half = frameOf(linear, { progress: 0.5, amplitude: 0, phase: 0, stop: 0.5 })
    expect(half.stop).toBe('circle(1px at 238px 2px)')
    const none = frameOf(linear, { progress: 0, amplitude: 0, phase: 0, stop: 0 })
    expect(none.stop).toBe('circle(0px at 238px 2px)')
  })

  it("draw the cycle's arc as a value's, from the top of the turned drawing, and shrink it away for a handover", () => {
    const circular = {
      kind: 'circular' as const,
      box: 48,
      radius: 22,
      across: 48,
      thickness: 4,
      gap: 4,
      wave: null,
      star: null,
      track: true,
    }
    const capDegrees = (2 * 180) / (Math.PI * 22)
    // The head's angle: the start cap's points lie behind the top, in the last few degrees.
    const angle = (d: string) =>
      Math.max(
        ...pointsOf(d)
          .map(([x, y]) => ((Math.atan2(x - 24, 24 - y) * 180) / Math.PI + 360) % 360)
          .filter((a) => a < 300),
      )
    // At a second the arc is 0.357 of a turn, as a value of that much is drawn.
    const time = 1000
    const cycling = frameOf(circular, { time, phase: 0 })
    expect(cycling.rotation).toBe(turnAt(time))
    const value = frameOf(circular, { progress: sweepAt(time), amplitude: 0, phase: 0 })
    expect(cycling.active).toBe(value.active)
    expect(cycling.track).toBe(value.track)
    expect(angle(cycling.active)).toBeCloseTo(sweepAt(time) * 360 + capDegrees, 0)
    // Half shrunk, its ink is half that, and gone it is nothing, the track the whole ring.
    const half = frameOf(circular, { time, phase: 0, shrink: 0.5 })
    expect(angle(half.active)).toBeCloseTo((sweepAt(time) * 360) / 2 + capDegrees, 0)
    const gone = frameOf(circular, { time, phase: 0, shrink: 1 })
    expect(extent(gone.active).right - extent(gone.active).left).toBe(0)
    const whole = frameOf(circular, { progress: 0, amplitude: 0, phase: 0 })
    expect(extent(gone.track)).toEqual(extent(whole.track))
  })

  const circular = {
    kind: 'circular' as const,
    box: 40,
    radius: 18,
    across: 40,
    thickness: 4,
    gap: 4,
    wave: null,
    star: null,
    track: true,
  }
  const angleOf = ([x, y]: [number, number]) =>
    ((Math.atan2(x - 20, 20 - y) * 180) / Math.PI + 360) % 360
  /** The tips of the caps, which lie on the center line: where the ink starts and ends. */
  const tips = (d: string) =>
    pointsOf(d)
      .filter(([x, y]) => Math.abs(Math.hypot(x - 20, y - 20) - 18) < 0.2)
      .map(angleOf)
  const capDegrees = (2 * 180) / (Math.PI * 18)

  it('give a circular indicator its arc from the top, and its track the rest less the gaps', () => {
    const frame = frameOf(circular, { progress: 0.5, amplitude: 0, phase: 0 })
    const active = extent(frame.active)
    expect(active.top).toBeCloseTo(0, 0)
    expect(active.right).toBeCloseTo(40, 1)
    expect(active.bottom).toBeCloseTo(40, 1)
    // Half way, the arc's center line ends at the bottom and its cap reaches 2dp to the left.
    expect(active.left).toBeCloseTo(18, 1)
    const track = extent(frame.track)
    expect(track.right).toBeLessThan(20)
    expect(track.left).toBeCloseTo(0, 1)
    // Whole, the ring closes: the two caps lie on each other at the top.
    const whole = pointsOf(frameOf(circular, { progress: 1, amplitude: 0, phase: 0 }).active)
    const radii = whole.map(([x, y]) => Math.hypot(x - 20, y - 20))
    expect(Math.max(...radii)).toBeCloseTo(20, 1)
    expect(Math.min(...radii)).toBeCloseTo(16, 1)
    // With no progress the track is the closed ring too: at the very top its outline runs
    // along both edges, not round two caps meeting at a point.
    const none = pointsOf(frameOf(circular, { progress: 0, amplitude: 0, phase: 0 }).track, 32)
    const atTop = none
      .filter(([x, y]) => Math.abs((Math.atan2(x - 20, 20 - y) * 180) / Math.PI) < 1)
      .map(([x, y]) => Math.hypot(x - 20, y - 20))
    expect(Math.max(...atTop)).toBeCloseTo(20, 1)
    expect(Math.min(...atTop)).toBeCloseTo(16, 1)
  })

  it('take the gaps as Android does: an angle over the whole size, a progress each at first', () => {
    // The gap and a thickness, 8dp, over the 40dp size's circumference: 22.9 degrees of the
    // track's center line, which its cap takes 6.4 of, so 3.2dp of gap shows after the head.
    const gapDegrees = (360 * 8) / (Math.PI * 40)
    const half = tips(frameOf(circular, { progress: 0.5, amplitude: 0, phase: 0 }).track)
    expect(Math.min(...half)).toBeCloseTo(180 + gapDegrees - capDegrees, 0)
    expect(Math.max(...half)).toBeCloseTo(360 - gapDegrees + capDegrees, 0)
    // At 1% the gaps are only the 3.6 degrees of progress each: the track runs from 7.2 to
    // 356.4 degrees, its caps reaching 0.8 and 2.8, under the arc's own caps.
    const early = tips(frameOf(circular, { progress: 0.01, amplitude: 0, phase: 0 }).track)
    expect(Math.min(...early)).toBeCloseTo(7.2 - capDegrees, 0)
    expect(Math.max(...early)).toBeCloseTo(356.4 + capDegrees - 360, 0)
  })

  it('draw the track backward once the gaps overlap, filling the gap from 89% on, as Android does', () => {
    // At 90% the track runs from 337.1 to 346.9 degrees: with its caps, 330.7 to 353.3, which
    // is all but a hair of what the arc's ink, up to 330.4 degrees, leaves open.
    const late = tips(frameOf(circular, { progress: 0.9, amplitude: 0, phase: 0 }).track)
    expect(Math.min(...late)).toBeCloseTo(330.7, 0)
    expect(Math.max(...late)).toBeCloseTo(353.3, 0)
    const arc = tips(frameOf(circular, { progress: 0.9, amplitude: 0, phase: 0 }).active)
    expect(Math.min(...arc)).toBeCloseTo(324 + capDegrees, 0)
    // Where the gaps meet exactly, there is no track.
    const none = frameOf(circular, {
      progress: (360 - (2 * (360 * 8)) / (Math.PI * 40)) / 360,
      amplitude: 0,
      phase: 0,
    })
    expect(extent(none.track).right - extent(none.track).left).toBe(0)
  })

  it("draw a wavy circular indicator as Android's star, its track the circle it morphs from", () => {
    const wavy = {
      ...circular,
      box: 51.2,
      radius: 22,
      across: 48,
      wave: { amplitude: 1.6, wavelength: 15 },
      star: { vertices: 9, share: 1 },
    }
    const radii = (d: string) => pointsOf(d).map(([x, y]) => Math.hypot(x - 25.6, y - 25.6))
    // Flat, the ring is the library's circle of nine arcs, fitted to the 44dp ring (not, as
    // Compose fits it, its control points' bounds, which draw it 2.5% smaller).
    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length
    const flat = radii(frameOf(wavy, { progress: 1, amplitude: 0, phase: 0 }).active)
    expect(mean(flat)).toBeCloseTo(22, 1)
    expect(Math.min(...flat)).toBeCloseTo(20, 0)
    expect(Math.max(...flat)).toBeCloseTo(24, 0)
    const track = radii(frameOf(wavy, { progress: 0, amplitude: 0, phase: 0 }).track)
    expect(mean(track)).toBeCloseTo(22, 1)
    expect(Math.min(...track)).toBeCloseTo(20, 0)
    expect(Math.max(...track)).toBeCloseTo(24, 0)
    // Wavy, the star rides the ring: its crests reach 23.4dp and its troughs 20.7dp from its
    // center, which is the box's, so the ink spans 18.7 to 25.4dp from there, 22 midway.
    const star = radii(frameOf(wavy, { progress: 1, amplitude: 1, phase: 0 }).active)
    expect(Math.min(...star)).toBeCloseTo(18.65, 1)
    expect(Math.max(...star)).toBeCloseTo(25.36, 1)
    expect((Math.min(...star) + Math.max(...star)) / 2).toBeCloseTo(22, 1)
    // Growing in, the wave spreads out from the ring both ways.
    const half = radii(frameOf(wavy, { progress: 1, amplitude: 0.5, phase: 0 }).active)
    expect(Math.min(...half)).toBeCloseTo(19.34, 1)
    expect(Math.max(...half)).toBeCloseTo(24.67, 1)
    // The arc runs clockwise from the top: a quarter covers the top right.
    const quarter = extent(frameOf(wavy, { progress: 0.25, amplitude: 1, phase: 0 }).active)
    expect(quarter.left).toBeGreaterThan(23)
    expect(quarter.bottom).toBeLessThan(28)
    expect(quarter.top).toBeLessThan(4)
    // Nothing at no progress, as on Android, where a part of no length is not drawn.
    const none = extent(frameOf(wavy, { progress: 0, amplitude: 1, phase: 0 }).active)
    expect(none.right - none.left).toBe(0)
    // The wave travels a point a second, turning the star back about its center, so the
    // same ink comes round every second.
    const at = (phase: number) => frameOf(wavy, { progress: 0.5, amplitude: 1, phase }).active
    expect(at(-0.5)).not.toBe(at(0))
    expect(at(-1)).toBe(at(0))
  })

  it("draw a wavy circular indicator's first frame alike whatever an engine's last digit", async () => {
    // The first frame is drawn on the server as well, and engines' sin, cos and atan2 differ
    // in the last digit: drawn again with each a digit off either way, it must not change.
    const firstFrames = (motion: typeof import('./motion')) =>
      [24, 48, 96, 240].flatMap((across) => {
        const k = across / 48
        const wavy = {
          kind: 'circular' as const,
          box: across + 3.2 * k,
          radius: 22 * k,
          across,
          thickness: 4 * k,
          gap: 4 * k,
          wave: { amplitude: 1.6 * k, wavelength: 15 * k },
          star: { vertices: motion.starVertices(across, 4 * k, 15 * k), share: 1 },
          track: true,
        }
        const phase = motion.circularPhaseAt(0)
        return [undefined, 0.1, 0.4, 0.75, 1].map((progress) =>
          motion.frameOf(
            wavy,
            progress === undefined
              ? { time: 0, phase }
              : { progress, amplitude: motion.amplitudeFor(progress), phase },
          ),
        )
      })
    const exact = firstFrames(await import('./motion'))
    const { sin, cos, atan2 } = Math
    for (const nudge of [1 + Number.EPSILON, 1 - Number.EPSILON / 2]) {
      // A fresh module, so that no shape is taken from its caches.
      vi.resetModules()
      vi.spyOn(Math, 'sin').mockImplementation((x) => sin(x) * nudge)
      vi.spyOn(Math, 'cos').mockImplementation((x) => cos(x) * nudge)
      vi.spyOn(Math, 'atan2').mockImplementation((y, x) => atan2(y, x) * nudge)
      try {
        expect(firstFrames(await import('./motion'))).toEqual(exact)
      } finally {
        vi.restoreAllMocks()
      }
    }
  })
})
