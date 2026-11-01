/* The motion of a progress indicator (shared.tsx), as what to draw at a moment: the easings,
 * the indeterminate cycles of Android's Compose indicators, and the frames of outlines
 * (geometry.ts) that the component plays as keyframes. Lengths in px. */
import {
  circularOutline,
  dotOutline,
  linearOutline,
  sample,
  strokeOutline,
  type Point,
} from './geometry'
import {
  MeasuredPath,
  circle,
  morphCubics,
  morphMatch,
  star,
  startingAt,
  transformCubic,
  type Cubic,
} from './polygon'

/** A cubic-bezier easing, as CSS defines it: the curve's y at the x given. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, s: number) =>
    3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let [lo, hi] = [0, 1]
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (at(x1, x2, mid) < x) lo = mid
      else hi = mid
    }
    return at(y1, y2, (lo + hi) / 2)
  }
}

export const linear = (x: number) => Math.min(1, Math.max(0, x))
export const standard = cubicBezier(0.2, 0, 0, 1)
export const emphasizedAccelerate = cubicBezier(0.3, 0, 0.8, 0.15)
export const emphasizedDecelerate = cubicBezier(0.05, 0.7, 0.1, 1)
/** Android's default animator easing, a half cosine: what its circular arc shrinks away on. */
export const accelerateDecelerate = (x: number) =>
  Math.cos((Math.min(1, Math.max(0, x)) + 1) * Math.PI) / 2 + 0.5

/** One wavelength of travel per second: Material's wave speed, the wave moving toward the start. */
export const wavePeriod = 1000

/** The wave is flat up to 10% of the progress and from 95% on, as Compose's indicators draw it. */
export const waveFrom = 0.1
export const waveUntil = 0.95

/** The amplitude a determinate indicator's wave is drawn at, as a share, for a progress. */
export const amplitudeFor = (progress: number) =>
  progress > waveFrom && progress < waveUntil ? 1 : 0

/** The wave's size changes over a long-2, drawn in on the standard easing and flattened on the emphasized accelerate. */
export const amplitudeEasing = { in: standard, out: emphasizedAccelerate }

/* A change of value is Material's spring, as Compose's ProgressIndicatorDefaults and the Android
 * library's DeterminateDrawable settle it: critically damped at the very low stiffness, at
 * rest once within a thousandth of the range, Compose's visibility threshold. */
export const changeStiffness = 50
export const changeThreshold = 1 / 1000

/**
 * A change of value from one progress to another, begun at a velocity (per ms): the progress
 * and velocity at a time (ms) into it, and when it rests, from when the progress is the target.
 */
export function change(from: number, to: number, velocity = 0) {
  const omega = Math.sqrt(changeStiffness) / 1000
  const a = from - to
  const b = velocity + omega * a
  const left = (t: number) => (a + b * t) * Math.exp(-omega * t)
  // Past its last extremum the swing only shrinks, so it rests once under the threshold there.
  const extremum = b === 0 ? 0 : Math.max(0, velocity / (omega * b))
  let rest = Math.ceil(extremum)
  while (Math.abs(left(rest)) >= changeThreshold) rest += 1
  const at = (t: number) => (t >= rest ? to : Math.min(1, Math.max(0, to + left(Math.max(0, t)))))
  const velocityAt = (t: number) =>
    t >= rest || t < 0 ? 0 : (b - omega * (a + b * t)) * Math.exp(-omega * t)
  return { at, velocityAt, rest }
}

/* A moment of a cycle. Its very end is kept as its end, not folded onto its start: the
 * keyframe there finishes every move, so that nothing is interpolated back to the start. */
const within = (time: number, cycle: number) =>
  time > 0 && time % cycle === 0 ? cycle : ((time % cycle) + cycle) % cycle

/* The indeterminate cycles are those of Android's Compose indicators (ProgressIndicator.kt),
 * which a recording of them plays frame for frame: two lines crossing a linear track in
 * turn over 1.75s, and a circular arc turning as it grows and shrinks over 6s. */

/** The keyframes of a cycle are set a 60fps frame apart. */
export const frameStep = 1000 / 60

export const linearCycle = 1750

/* When each line's head and tail set off into the cycle and how long each takes to cross
 * the track, in ms; all four cross on the emphasized accelerate easing. */
const linearLines = [
  { head: [0, 1000], tail: [250, 1000] },
  { head: [650, 850], tail: [900, 850] },
] as const

/** A line of the cycle: where its tail and its head are, as shares of the track. */
export type Line = { from: number; to: number }

/** Where the two lines are at a moment of the cycle. */
export function linearIndeterminate(time: number): [first: Line, second: Line] {
  const t = within(time, linearCycle)
  const crossed = ([delay, duration]: readonly [number, number]) =>
    emphasizedAccelerate((t - delay) / duration)
  const [first, second] = linearLines.map(({ head, tail }) => ({
    from: crossed(tail),
    to: crossed(head),
  }))
  return [first!, second!]
}

/** The moment of the cycle from which no line is drawn: its end, the second line's tail reaching it as the first's head is about to set off. */
export const linearInkGone = linearCycle

/**
 * The change from indeterminate to determinate, as the guideline video of it makes it: the
 * cycle plays on until its lines have left, then the stop indicator pops in 4 frames later
 * over 13 on the standard easing, and the value fills from 0 after 29.
 */
export const handover = {
  dotDelay: 4 * frameStep,
  dotDuration: 13 * frameStep,
  fillDelay: 29 * frameStep,
}

/** A circular arc instead shrinks away into its tail over 500ms, as Android completes its cycle. */
export const circularLeave = 500

export const circularCycle = 6000

/* The turn: 180 degrees a second throughout, and a further 90 from the start of each quarter
 * of the cycle, over 300ms, evenly (Compose's keyframes take an easing for the interval
 * after each key, so the steps run on the default, linear). The drawing, whose arc starts at
 * the top, is first turned a quarter on, so that the arc sets off from the right as Android's. */
const turnRate = 180 / 1000
const stepEvery = 1500
const stepOver = 300

/** How far the drawing is turned at a moment, in degrees, counted on without wrapping. */
export function turnAt(time: number) {
  const steps = Math.floor(time / stepEvery)
  const into = time - steps * stepEvery
  return 90 + turnRate * time + 90 * (steps + Math.min(1, into / stepOver))
}

/** The arc's sweep, as shares of a turn: from a tenth to 0.87 over the first half of the cycle, evenly, and back over the second on the standard easing. */
export const circularSweep = { least: 0.1, most: 0.87 }

/** The arc's sweep at a moment of the cycle, as a share of a turn. */
export function sweepAt(time: number) {
  const t = within(time, circularCycle)
  const half = circularCycle / 2
  const { least, most } = circularSweep
  return t <= half
    ? least + (most - least) * (t / half)
    : most - (most - least) * standard((t - half) / half)
}

/** The drawing of a circular indicator, at its size: everything in px of the box it fills. */
export type CircularScene = {
  kind: 'circular'
  /**
   * The box the drawing fills: the size across and, with a wave, its amplitude on each side,
   * where the crests go; and the radius of the track's center line about the box's center.
   */
  box: number
  radius: number
  /** The size across, which the drawing of a value keeps to. */
  across: number
  thickness: number
  gap: number
  wave: { amplitude: number; wavelength: number } | null
  /**
   * The determinate wave: Compose's rounded star of as many points, morphed from a circle
   * by the share of the way the wave's amplitude is of the default.
   */
  star: { vertices: number; share: number } | null
  track: boolean
}

export type LinearScene = {
  kind: 'linear'
  width: number
  thickness: number
  gap: number
  wave: { amplitude: number; wavelength: number } | null
  track: boolean
  /** The stop indicator: its diameter and the space after it, or none. */
  stop: { size: number; trailing: number } | null
}

export type Scene = CircularScene | LinearScene

/** What is drawn at one moment: the paths the parts are clipped to, and the turn of a circular drawing. */
export type Frame = { active: string; track: string; stop?: string; rotation?: number }

/** A determinate moment: the progress, the wave's amplitude as a share, its phase, and how far the stop indicator has popped in. */
export type Determinate = { progress: number; amplitude: number; phase: number; stop?: number }
/** An indeterminate moment of the cycle, and how far a circular arc has shrunk away for a handover. */
export type Indeterminate = { time: number; phase: number; shrink?: number }

/** A wavy stroke's fixed nodes: six to a wavelength along the whole track, and its two ends. */
const gridOf = (wavelength: number) => wavelength / 6
const nodesFor = (length: number, wavelength: number) => Math.floor(length / gridOf(wavelength)) + 3

const positiveModulo = (n: number, m: number) => ((n % m) + m) % m

/**
 * The length along a wave of parabolas at its full amplitude, by which Compose cuts the drawn
 * part: the length a wavelength's width measures as, and where a length along it falls.
 */
export function waveArc(amplitude: number, wavelength: number) {
  const half = wavelength / 2
  const k = (8 * amplitude) / wavelength
  // The parabola's arc in u = 1 - 4x/wavelength, which runs from 1 to -1 over a half wave.
  const F = (u: number) => (u * Math.sqrt(1 + k * k * u * u)) / 2 + Math.asinh(k * u) / (2 * k)
  const halfLength = (wavelength / 2) * F(1)
  const within = (x: number) => (wavelength / 4) * (F(1) - F(1 - (4 * x) / wavelength))
  const inverse = (s: number) => {
    const halves = Math.floor(s / halfLength)
    const rest = s - halves * halfLength
    let [lo, hi] = [0, half]
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2
      if (within(mid) < rest) lo = mid
      else hi = mid
    }
    return halves * half + (lo + hi) / 2
  }
  return { scale: halfLength / half, inverse }
}

/* Compose's shapes for a circular wavy indicator of a vertex count: its track is the library's
 * circle, its active indicator a rounded star morphed from that circle, both fitted to a unit
 * square by their curves' bounds. */
const starCache = new Map<number, [Cubic, Cubic][]>()
function starShapes(vertices: number) {
  let match = starCache.get(vertices)
  if (!match) {
    const track = circle(vertices).normalized()
    const active = star(
      vertices,
      0.75,
      { radius: 0.35, smoothing: 0.4 },
      { radius: 0.5, smoothing: 0 },
    ).normalized()
    match = morphMatch(track, active)
    starCache.set(vertices, match)
  }
  return match
}

/** How many points Compose's star has for a size, thickness and wavelength: the nearest whole number of waves round, five at least. */
export const starVertices = (across: number, thickness: number, wavelength: number) =>
  Math.max(5, Math.round((2 * Math.PI * (across / 2 - thickness / 2)) / wavelength))

/**
 * The star at a size and morph, measured: the shape starts at the top, has its own center, the
 * mean of its outline, on the box's, and is scaled so that its wave rides the ring, as the
 * spec's diagram has it: the midline between its crests and its troughs is the ring, the
 * crests reaching out past it as far as the troughs reach in. (Compose fits the bounds of
 * its curves to the size less the stroke instead, which lays the crests on the ring and the
 * wave inside it, 1.3dp in at 48dp, and centers those bounds, which an odd star's center is
 * a little off, so that its star is carried round as the wave travels; the recordings show
 * at most a fifth of a dp of that.) Kept for the frames of a wave at rest.
 */
const pathCache = new Map<string, MeasuredPath>()
function starPath(vertices: number, morph: number, size: number, center: Point) {
  const key = `${vertices}:${morph}:${size}:${center[0]}:${center[1]}`
  let path = pathCache.get(key)
  if (!path) {
    const unit = startingAt(morphCubics(starShapes(vertices), morph), [0.5, 0.5], 270)
    const drawn = new MeasuredPath(unit)
    const samples = 90 * vertices
    const points: Point[] = []
    let [mx, my] = [0, 0]
    for (let i = 0; i < samples; i++) {
      const { point } = drawn.at((i / samples) * drawn.length)
      points.push(point)
      mx += point[0] / samples
      my += point[1] / samples
    }
    let [least, most] = [Infinity, 0]
    for (const [x, y] of points) {
      const r = Math.hypot(x - mx, y - my)
      least = Math.min(least, r)
      most = Math.max(most, r)
    }
    const fit = size / (least + most)
    path = new MeasuredPath(
      unit.map((c) =>
        transformCubic(c, (x, y) => [center[0] + (x - mx) * fit, center[1] + (y - my) * fit]),
      ),
    )
    if (pathCache.size > 64) pathCache.clear()
    pathCache.set(key, path)
  }
  return path
}

function starFrame(
  scene: CircularScene,
  progress: number,
  amplitude: number,
  phase: number,
): Frame {
  const { box, across, thickness, gap } = scene
  const { vertices, share } = scene.star!
  const center: Point = [box / 2, box / 2]
  const size = across - thickness
  const path = starPath(vertices, amplitude * share, size, center)
  const stop = progress * path.length
  const cap = thickness / 2
  const spacing = 2 * Math.min(stop, cap) + Math.min(stop, gap)
  // The wave travels one wavelength a second: the drawn part is cut that much further along
  // the shape and the whole turned back as far, about the box's center.
  const offset = positiveModulo(-phase, vertices) / vertices
  const turnBack = -offset * 2 * Math.PI
  const [cos, sin] = [Math.cos(turnBack), Math.sin(turnBack)]
  const turnedPoint = (p: Point): Point => [
    center[0] + (p[0] - center[0]) * cos - (p[1] - center[1]) * sin,
    center[1] + (p[0] - center[0]) * sin + (p[1] - center[1]) * cos,
  ]
  const turnedVector = (v: Point): Point => [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos]
  // The nodes are fixed along the shape, twelve to a point, so that as the head moves only
  // it travels between one outline and the next; those past it are gathered at the head.
  // Counted in nodes, not by length, whose last digit differs between JavaScript engines.
  const grid = path.length / (vertices * 12)
  const nodes = vertices * 12 + 3
  const tail = positiveModulo(-phase, vertices) * 12
  const head = tail + progress * vertices * 12
  const steps: number[] = [tail]
  for (let k = Math.floor(tail) + 1; k < head && steps.length < nodes - 1; k++) steps.push(k)
  while (steps.length < nodes) steps.push(head)
  const along = steps.map((step) => step * grid)
  const samples = along.map((s) => {
    const { point, first, second } = path.at(s)
    return sample(turnedPoint(point), turnedVector(first), turnedVector(second))
  })
  const active = strokeOutline(
    samples,
    progress > 0 ? thickness : 0,
    along.slice(1).map((s, i) => s - along[i]!),
  )
  // The track is drawn by its own length, from the head's share plus the spacing to the
  // spacing short of its end, so the gaps match the active indicator's caps and the gap.
  const trackRadius = size / 2
  const trackLength = 2 * Math.PI * trackRadius
  const trackStart = progress * trackLength + spacing
  const trackStop = trackLength - spacing
  const track =
    scene.track && trackStart < trackStop
      ? circularOutline({
          center,
          radius: trackRadius,
          start: trackStart / trackRadius,
          sweep: (trackStop - trackStart) / trackRadius,
          thickness,
          nodes: 25,
        })
      : circularOutline({
          center,
          radius: trackRadius,
          start: 0,
          sweep: 0,
          thickness: 0,
          nodes: 25,
        })
  return { active, track }
}

function linearFrame(scene: LinearScene, state: Determinate | Indeterminate): Frame {
  const { width, thickness, gap, wave } = scene
  const cap = thickness / 2
  const y = thickness / 2 + (wave?.amplitude ?? 0)
  const nodes = wave ? nodesFor(width, wave.wavelength) : 2
  const coerce = (x: number) => Math.min(width - cap, Math.max(cap, x))
  // No ink at a point, drawn through as many nodes as what it stands in for, so it interpolates.
  const nothing = (at: number, through = nodes) =>
    linearOutline({ from: at, to: at, thickness: 0, y, nodes: through })
  const segment = (from: number, to: number, amplitude: number, phase: number) =>
    linearOutline({
      from,
      to,
      thickness,
      y,
      wave: wave
        ? { amplitude: wave.amplitude * amplitude, wavelength: wave.wavelength, phase }
        : undefined,
      nodes,
      grid: wave ? gridOf(wave.wavelength) : undefined,
    })
  // Compose cuts the drawn part of a wavy bar out of the full wave by its length, once the
  // wave has shifted, and shifts it back: where a stretch between two points of the track
  // then falls. The wave's full height counts for the length whenever it is not flat.
  const cut = (from: number, to: number, amplitude: number, phase: number): [number, number] => {
    if (!wave || amplitude === 0) return [from, to]
    const { scale, inverse } = waveArc(wave.amplitude, wave.wavelength)
    const shift = positiveModulo(-phase, 1) * wave.wavelength
    return [inverse((from + shift) * scale) - shift, inverse((to + shift) * scale) - shift]
  }
  // A piece of the track: a straight line between two points, a dot where they meet, or
  // none where there is no room.
  const trackPiece = (from: number, to: number) =>
    from <= to ? linearOutline({ from, to, thickness, y, nodes: 2 }) : nothing(to, 2)
  if ('progress' in state) {
    // Drawn as Compose draws its two linear indicators: the flat one as lines from the start
    // to the head and from a gap past it, the wavy one cut out of the full wave by length.
    const { progress, amplitude, phase } = state
    const wavy = wave !== null
    const barHead = progress * width
    const head = coerce(barHead)
    let active: string
    let trackFrom: number | null
    if (wavy) {
      const [from, to] = cut(cap, head, amplitude, phase)
      active = progress > 0 && to > from ? segment(from, to, amplitude, phase) : nothing(cap)
      // The gap opens with the head, from where its cap fits; the track is drawn only with room left.
      const entryGap = barHead < cap ? 0 : Math.min(barHead - cap, gap)
      const spacing = barHead >= cap ? entryGap + 2 * cap : entryGap
      trackFrom = width - cap > head + spacing ? Math.max(cap, head + spacing) : null
    } else {
      active = progress > 0 ? segment(cap, head, 0, 0) : nothing(cap)
      // The track starts a gap and a thickness past the head, as far as the progress allows,
      // while short of the end; at the end it is a dot under the stop indicator.
      const fraction = progress + Math.min(progress, (gap + thickness) / width)
      trackFrom = fraction < 1 ? Math.min(width - cap, Math.max(cap, fraction * width)) : null
    }
    const track =
      scene.track && trackFrom !== null
        ? linearOutline({ from: trackFrom, to: width - cap, thickness, y, nodes: 2 })
        : nothing(width - cap, 2)
    let stop = 'circle(0px at 0px 0px)'
    if (scene.stop) {
      const { size, trailing } = scene.stop
      let diameter = size
      let center = width - trailing - size / 2
      if (wavy) {
        // The wavy indicator's dot shrinks from its start as the head's ink reaches it.
        const left = width - size - trailing
        const inkEnd = barHead + cap
        if (left <= inkEnd) {
          diameter = Math.max(0, size - (inkEnd - left))
          center = inkEnd + diameter / 2
        }
      }
      diameter *= state.stop ?? 1
      stop = `circle(${diameter / 2}px at ${center}px ${y}px)`
    }
    return { active, track, stop }
  }
  // The cycle's lines, each drawn as a value's bar is: a line between its ends, kept within
  // the caps, the wavy one cut out of the full wave by length; a dot where the ends meet.
  const lines = linearIndeterminate(state.time)
  const active = lines
    .map(({ from, to }) => {
      if (to <= from) return nothing(coerce(to * width))
      const [a, b] = cut(coerce(from * width), coerce(to * width), 1, state.phase)
      return segment(a, b, 1, state.phase)
    })
    .join('')
  // Three pieces of track, each where Compose draws it for the shape, or none: the flat
  // one's by shares of the track, a gap and a thickness from each line, as lines between
  // the caps, which meet in a dot as a piece begins; the wavy one's from the end backward,
  // the gap opening as the first line's head enters.
  const [first, second] = lines
  const pieces: ([number, number] | null)[] = []
  if (!wave) {
    const share = (gap + thickness) / width
    const piece = (shown: boolean, from: number, to: number) =>
      pieces.push(
        shown && from !== to
          ? [coerce(Math.min(from, to) * width), coerce(Math.max(from, to) * width)]
          : null,
      )
    piece(first.to < 1 - share, first.to > 0 ? first.to + share : 0, 1)
    piece(
      first.from > share,
      second.to > 0 ? second.to + share : 0,
      first.from < 1 ? first.from - share : 1,
    )
    piece(second.from > share, 0, second.from < 1 ? second.from - share : 1)
  } else {
    let end = width - cap
    let spacing = 0
    lines.forEach(({ from, to }, i) => {
      const [tail, head] = [from * width, to * width]
      if (i === 0) spacing = head < cap ? 0 : Math.min(head - cap, gap) + 2 * cap
      const start = coerce(head) + spacing
      pieces.push(end > start ? [Math.max(cap, start), end] : null)
      if (head > tail) end = Math.max(cap, coerce(tail) - spacing)
    })
    pieces.push(end > cap ? [cap, end] : null)
  }
  const track = pieces
    .map((piece, i) =>
      scene.track && piece
        ? trackPiece(piece[0], piece[1])
        : nothing(i === 0 ? width - cap : cap, 2),
    )
    .join('')
  return { active, track }
}

function circularFrame(scene: CircularScene, state: Determinate | Indeterminate): Frame {
  if (!('progress' in state)) {
    // The cycle's arc, drawn as a value's is from the top of the turning drawing, and
    // shrunk away for a handover.
    const sweep = sweepAt(state.time) * (1 - (state.shrink ?? 0))
    const frame = circularFrame(scene, { progress: sweep, amplitude: 1, phase: state.phase })
    return { ...frame, rotation: turnAt(state.time) }
  }
  const { progress, amplitude, phase } = state
  if (scene.star) return starFrame(scene, progress, amplitude, phase)
  const { box, radius, thickness, gap } = scene
  const center: Point = [box / 2, box / 2]
  const turn = 2 * Math.PI
  const nothing = (at: number) =>
    circularOutline({ center, radius, start: at, sweep: 0, thickness: 0, nodes: 25 })
  const arc = (start: number, sweep: number) =>
    circularOutline({ center, radius, start, sweep, thickness, nodes: 25 })
  const trackArc = (start: number, end: number) =>
    start < end ? arc(start, end - start) : nothing(end)
  // Compose's arcs: the active one from the top round the progress, the track the rest of the
  // turn less a gap each side, the gap's angle taken over the full size so that the arcs do
  // not quite leave the gap itself; past where the gaps overlap it is drawn backward.
  const sweep = Math.min(1, Math.max(0, progress)) * turn
  const active = sweep > 0 ? arc(0, sweep) : nothing(0)
  const gapSweep = (2 * (gap + thickness)) / scene.across
  const trackStart = sweep + Math.min(sweep, gapSweep)
  const trackSweep = turn - sweep - 2 * Math.min(sweep, gapSweep)
  const track =
    !scene.track || trackSweep === 0
      ? nothing(trackStart)
      : trackSweep > 0
        ? trackArc(trackStart, trackStart + trackSweep)
        : trackArc(trackStart + trackSweep, trackStart)
  return { active, track }
}

/** What is drawn for a scene in a state. */
export const frameOf = (scene: Scene, state: Determinate | Indeterminate): Frame =>
  scene.kind === 'linear' ? linearFrame(scene, state) : circularFrame(scene, state)

/** The wave's phase at a moment, in wavelengths: it travels toward the start, one a second. */
export const phaseAt = (time: number) => (time === 0 ? 0 : -time / wavePeriod)

/* Where a wave stands against its cycle is a matter of when Compose started each: the
 * recording has a linear crest 0.98 of a wavelength along the track as its first whole
 * cycle starts (a quarter less at each cycle after, the wave's second not dividing the
 * cycle, which one loop cannot follow), and a circular star half a point on. */
export const linearWavePhase = 0.7333
export const circularWavePhase = -0.5

/** The phase of a linear indicator's wave at a moment of its cycle: it travels as a value's does, from where the recording has it. */
export const linearCyclePhaseAt = (time: number) =>
  phaseAt(within(time, linearCycle)) + linearWavePhase

/** The phase of a circular indicator's star at a moment: a point a second, from where the recording has it. */
export const circularPhaseAt = (time: number) => phaseAt(time) + circularWavePhase

/** Clips a path to an element: the keyframe property the frames are played on. */
export const clip = (path: string) => `path("${path}")`

export { dotOutline }
