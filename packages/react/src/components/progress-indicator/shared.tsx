import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { ProgressBarProps } from 'react-aria-components'
import { ms } from '../../lib/motion'
import {
  accelerateDecelerate,
  amplitudeEasing,
  amplitudeFor,
  change,
  circularCycle,
  circularLeave,
  circularPhaseAt,
  clip,
  frameOf,
  frameStep,
  handover,
  linearCycle,
  linearCyclePhaseAt,
  linearInkGone,
  phaseAt,
  standard,
  turnAt,
  wavePeriod,
  type Frame,
  type Scene,
} from './motion'

/* What the linear and the circular progress indicator share: the props both add to React
 * Aria's ProgressBar, the progress it draws, and the motion that plays the parts' outlines. */

export type Shape = 'flat' | 'wavy'

// The props both indicators add to React Aria's ProgressBar ones. The comments on them quote
// the M3 progress indicator pages, which each comment lists under @see; they add no wording of our own.
export type SharedProps = {
  /**
   * The active indicator has two shape options: flat and wavy. Use the shape
   * that best fits the product’s tone.
   *
   * The wavy shape can make longer processes feel less static and is best used
   * when a more expressive style is appropriate.
   *
   * When using the wavy shape, the overall height of the component changes. At
   * very small sizes, the wavy shape may not be as visible.
   *
   * In very small buttons, use the flat shape since the wavy shape is not as
   * visible at that size.
   *
   * @default 'flat'
   * @see https://m3.material.io/components/progress-indicators/guidelines
   */
  shape?: Shape
  /**
   * Thickness: Default (4dp) and variable
   *
   * The thicker variants are provided as sample measurement for makers to
   * adjust the default version based on their use cases.
   *
   * @default 4
   * @see https://m3.material.io/components/progress-indicators/specs
   */
  thickness?: number
  /**
   * When integrated into another component, such as a button, make sure that
   * the active indicator provides visual contrast of at least 3:1 against the
   * other component.
   *
   * For the active indicator, use the same color as the label text or icon. The
   * track should be removed.
   *
   * @default true
   * @see https://m3.material.io/components/progress-indicators/accessibility
   */
  showTrack?: boolean
}

/** The spec's gap beside the active indicator, in dp. */
export const gap = 4

/**
 * The shortest wavelength drawn, in dp. The outlines hold six nodes a wave, built as keyframes
 * at mount and at every change of value, so their cost grows as the wavelength shrinks: at 8dp
 * it is about twice the default's, and a wave of 0 would never end.
 */
export const wavelengthLeast = 8

/**
 * The wave an indicator draws, or none when flat. A number that is not one falls back to the
 * default, and a wavelength shorter than the least, or than the stroke is thick, where a wave
 * overlaps itself, is drawn at that.
 */
export function waveOf(
  shape: Shape,
  amplitude: number,
  wavelength: number,
  thickness: number,
  defaults: { amplitude: number; wavelength: number },
) {
  if (shape !== 'wavy') return null
  const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback)
  return {
    amplitude: finite(amplitude, defaults.amplitude),
    wavelength: Math.max(wavelengthLeast, thickness, finite(wavelength, defaults.wavelength)),
  }
}

/**
 * The progress, from 0 to 1, as React Aria's ProgressBar reports it: its value kept within
 * its range, or none when indeterminate. A value that is not a number is drawn as none made.
 */
export function progressOf({
  value = 0,
  minValue = 0,
  maxValue = 100,
  isIndeterminate,
}: Pick<ProgressBarProps, 'value' | 'minValue' | 'maxValue' | 'isIndeterminate'>) {
  if (isIndeterminate) return undefined
  const range = maxValue - minValue
  const progress =
    range === 0 ? 0 : (Math.min(maxValue, Math.max(minValue, value)) - minValue) / range
  return Number.isFinite(progress) ? progress : 0
}

const now = () => (document.timeline?.currentTime as number | null | undefined) ?? performance.now()

type Plan = {
  progress: (time: number) => number
  velocity: (time: number) => number
  amplitude: (time: number) => number
  /** The indeterminate cycle, or a determinate plan. */
  loop: boolean
  /** Handing over from the cycle: when its last ink is gone, the moment the rest is timed from. */
  leave?: number
  animations: Animation[]
}

/**
 * Plays the parts' outlines as keyframes: a determinate indicator's progress and wave come
 * to their new values and then its wave travels on without end, an indeterminate one cycles.
 * Given a value while cycling, the cycle first runs out, as in the guideline video of the change.
 */
export type Parts = {
  active: RefObject<HTMLDivElement | null>
  track: RefObject<HTMLDivElement | null>
  stop?: RefObject<HTMLDivElement | null>
  turn?: RefObject<HTMLDivElement | null>
}

export function useMotion(parts: Parts, scene: Scene | null, progress: number | undefined) {
  const plan = useRef<Plan | null>(null)
  const sceneKey = scene ? JSON.stringify(scene) : null
  useLayoutEffect(() => {
    const [active, track, stop, turn] = [
      parts.active.current,
      parts.track.current,
      parts.stop?.current ?? null,
      parts.turn?.current ?? null,
    ]
    if (!scene || !active) return
    for (const animation of plan.current?.animations ?? []) animation.cancel()
    // Without the Web Animations API, as in jsdom, the parts show the state they are given.
    if (typeof active.animate !== 'function') {
      const frame = frameOf(
        scene,
        progress === undefined
          ? { time: 0, phase: 0 }
          : { progress, amplitude: amplitudeFor(progress), phase: 0 },
      )
      active.style.clipPath = clip(frame.active)
      if (track) track.style.clipPath = clip(frame.track)
      if (stop) stop.style.clipPath = frame.stop ?? ''
      plan.current = null
      return
    }
    const start = now()
    const settle = (
      el: HTMLElement | null,
      frames: Partial<Keyframe>[],
      options: KeyframeAnimationOptions,
      at: number,
    ) => {
      if (!el) return null
      const animation = el.animate(frames as Keyframe[], options)
      animation.startTime = at
      return animation
    }
    const keyframe = (frame: Frame, offset: number) => ({
      active: { clipPath: clip(frame.active), offset },
      track: { clipPath: clip(frame.track), offset },
      stop: { clipPath: frame.stop ?? 'circle(0px at 0px 0px)', offset },
      turn: { rotate: `${frame.rotation ?? 0}deg`, offset },
    })
    const play = (
      times: number[],
      stateAt: (time: number) => Parameters<typeof frameOf>[1],
      options: KeyframeAnimationOptions,
      at: number,
      // The turn of a circular drawing is keyed at every frame, its paths at fewer.
      turnTimes = times,
      rotationAt: (time: number) => number = () => 0,
    ) => {
      const offsets = (list: number[]) => {
        const span = list[list.length - 1]! - list[0]!
        return list.map((time) => (span ? (time - list[0]!) / span : 0))
      }
      const frames = times.map((time, i) =>
        keyframe(frameOf(scene, stateAt(time)), offsets(times)[i]!),
      )
      const turns = turnTimes.map((time, i) => ({
        rotate: `${rotationAt(time)}deg`,
        offset: offsets(turnTimes)[i]!,
      }))
      return [
        settle(
          active,
          frames.map((f) => f.active),
          options,
          at,
        ),
        settle(
          track,
          frames.map((f) => f.track),
          options,
          at,
        ),
        settle(
          stop,
          frames.map((f) => f.stop),
          options,
          at,
        ),
        settle(turn, turns, options, at),
      ].filter((animation): animation is Animation => animation !== null)
    }
    const steps = (from: number, to: number, step: number) => {
      const times: number[] = []
      for (let t = from; t < to; t += step) times.push(t)
      times.push(to)
      return times
    }
    const phase = scene.kind === 'circular' ? circularPhaseAt : phaseAt

    if (progress === undefined) {
      // The cycle, played from the page's own clock, so every indicator is in step: a linear
      // one keyed at every frame, a circular one's paths at every other and its turn at each.
      // Both waves travel as a value's does, from where the recording has them.
      const linear = scene.kind === 'linear'
      const loop = linear ? linearCycle : circularCycle
      const animations = play(
        steps(0, loop, linear ? frameStep : 2 * frameStep),
        (time) => ({ time, phase: linear ? linearCyclePhaseAt(time) : circularPhaseAt(time) }),
        { duration: loop, iterations: Infinity },
        0,
        steps(0, loop, frameStep),
        linear ? () => 0 : turnAt,
      )
      plan.current = {
        progress: () => 0,
        velocity: () => 0,
        amplitude: () => 0,
        loop: true,
        animations,
      }
      return
    }

    // From where the last plan has got to, at its pace: a new value is settled into on Material's
    // spring, and the wave is drawn in or flattened over a long-2 when it crosses in. Under
    // reduced motion the token collapses to 0.01ms, and the change then snaps like the ramps.
    const before = plan.current
    const ramp = ms(
      getComputedStyle(active).getPropertyValue('--md-sys-motion-duration-long2'),
      500,
    )
    const instant = !before || ramp < 1
    // Handing over from the cycle, the drawing first runs out: the lines of a linear one run
    // off the end as in the video, a circular arc shrinks away as on Android. The stop
    // indicator then pops in and the value fills from 0, each a set time after. A plan that
    // was already waiting keeps its moment; under reduced motion the change is at once.
    const waiting =
      !instant && before.leave !== undefined && before.leave + handover.fillDelay > start
    const handing = !instant && (before.loop || waiting)
    let leave = start
    if (handing && before.loop && scene.kind === 'linear') {
      const at = ((start % linearCycle) + linearCycle) % linearCycle
      leave = at < linearInkGone ? start + linearInkGone - at : start
    } else if (handing && before.loop) leave = start + circularLeave
    else if (handing) leave = before.leave!
    const fillAt = handing ? leave + handover.fillDelay : start
    const dotAt = leave + handover.dotDelay
    const stopAt = (time: number) =>
      !handing ? 1 : instant ? 1 : standard((time - dotAt) / handover.dotDuration)
    const from = before ? before.progress(start) : progress
    const amplitudeFrom = before ? before.amplitude(start) : amplitudeFor(progress)
    const move = change(from, progress, instant ? 0 : before.velocity(start))
    const tween = instant ? 0 : move.rest
    const progressAt = (time: number) => (instant ? progress : move.at(time - fillAt))
    const velocityAt = (time: number) => (instant ? 0 : move.velocityAt(time - fillAt))
    // The wave's size follows the progress: toward 1 between the thresholds and 0 outside, each
    // change over the ramp, drawn in on the standard easing and flattened on the emphasized accelerate.
    const changes: { at: number; from: number; to: number }[] = []
    let target = amplitudeFor(from)
    let level = amplitudeFrom
    if (target !== level) changes.push({ at: start, from: level, to: target })
    const horizon = fillAt + tween
    for (let t = start; t <= horizon + 1; t += 1) {
      const next = amplitudeFor(progressAt(Math.min(t, horizon)))
      if (next !== target) {
        level = amplitudeAt(t)
        target = next
        changes.push({ at: t, from: level, to: next })
      }
    }
    function amplitudeAt(time: number) {
      const last = changes.filter((c) => c.at <= time).pop()
      if (!last) return amplitudeFrom
      const share = ramp > 0 ? Math.min(1, (time - last.at) / ramp) : 1
      const eased = last.to > last.from ? amplitudeEasing.in(share) : amplitudeEasing.out(share)
      return last.from + (last.to - last.from) * eased
    }
    const lastChange = changes.length ? changes[changes.length - 1]!.at + ramp : start
    const restAt = Math.max(horizon, lastChange)
    const waving = scene.wave !== null && amplitudeAt(restAt) > 0
    // Until it rests, when the wave's loop takes over from where the travel has got to.
    const until = restAt
    const animations: Animation[] = []
    // Until the ink has left, the cycle's own frames; a circular arc shrinking the while.
    const state = (time: number): Parameters<typeof frameOf>[1] => {
      if (time >= leave) {
        return {
          progress: progressAt(time),
          amplitude: amplitudeAt(time),
          phase: phase(time),
          stop: stopAt(time),
        }
      }
      if (scene.kind === 'linear') return { time, phase: linearCyclePhaseAt(time) }
      return {
        time,
        phase: circularPhaseAt(time),
        shrink: accelerateDecelerate((time - (leave - circularLeave)) / circularLeave),
      }
    }
    const rotationAt = (time: number) =>
      scene.kind === 'circular' && time < leave ? turnAt(time) : 0
    if (until > start) {
      // While the cycle runs out it is keyed on its own frames, from the page's clock; the
      // last of them and the first determinate one share a moment, a step and not a blend.
      // The grid is kept a hair clear of both ends, so that no two keyframes change order.
      const times =
        leave > start
          ? [
              start,
              ...steps(Math.ceil(start / frameStep) * frameStep, leave, frameStep).filter(
                (t) => t > start + 0.02 && t < leave - 0.02,
              ),
              leave - 0.01,
              ...steps(leave, until, frameStep),
            ]
          : steps(start, until, frameStep)
      animations.push(
        ...play(
          times,
          state,
          { duration: until - start, fill: 'forwards' },
          start,
          times,
          rotationAt,
        ),
      )
    } else {
      animations.push(...play([start, start + 1], state, { duration: 1, fill: 'forwards' }, start))
    }
    if (waving) {
      // The wave at rest, keyed every 40ms over a wavelength's travel, which brings a star's
      // ink round too, as it turns about its center.
      animations.push(
        ...play(
          steps(0, wavePeriod, 40),
          (time) => ({ progress, amplitude: amplitudeAt(until), phase: phase(until + time) }),
          { duration: wavePeriod, iterations: Infinity, delay: until },
          0,
        ),
      )
    }
    plan.current = {
      progress: progressAt,
      velocity: velocityAt,
      amplitude: amplitudeAt,
      loop: false,
      leave: handing ? leave : undefined,
      animations,
    }
    // The scene by value, through its key; the parts are read when the effect runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parts, sceneKey, progress])

  useLayoutEffect(
    () => () => {
      for (const animation of plan.current?.animations ?? []) animation.cancel()
    },
    [],
  )
}
