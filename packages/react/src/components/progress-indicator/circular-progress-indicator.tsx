import { useMemo, useRef, type CSSProperties } from 'react'
import {
  composeRenderProps,
  ProgressBar,
  type ProgressBarProps,
  type ProgressBarRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import {
  amplitudeFor,
  circularPhaseAt,
  clip,
  frameOf,
  starVertices,
  type CircularScene,
} from './motion'
import { gap, progressOf, useMotion, waveOf, type Parts, type SharedProps } from './shared'

// The spec's measurements, in dp: the wave, the sizes, and the natural size: a ring of 44dp
// across the stroke's center for either shape, so that the 4dp stroke makes it 48;
// other sizes draw it in proportion.
const wave = { amplitude: 1.6, wavelength: 15 }
const ringAcross = 44
const sizeLeast = 24
const sizeMost = 240

type CircularProps = {
  /**
   * Circular progress indicators have flexible sizes. They can range from 24dp
   * to 240dp, depending on the placement and the breakpoint. Avoid exceeding
   * the minimum and maximum sizes.
   *
   * Reserve very large progress indicators for large and extra-large windows,
   * such as desktop.
   *
   * The waveform should scale with the size so the proportions look the same
   * across sizes
   *
   * @default 48
   * @see https://m3.material.io/components/progress-indicators/guidelines
   * @see https://m3.material.io/components/progress-indicators/specs
   */
  size?: number
  /**
   * Wavy indicators use amplitude and wavelength to determine the shape of the
   * wave. The height is the overall container height.
   *
   * Amplitude measures from the center of the resting position to the center of
   * the peak
   *
   * @default 1.6
   * @see https://m3.material.io/components/progress-indicators/specs
   */
  amplitude?: number
  /**
   * Wavy indicators use amplitude and wavelength to determine the shape of the
   * wave. The height is the overall container height.
   *
   * Wavelength measures the distance between two adjacent peaks
   *
   * @default 15
   * @see https://m3.material.io/components/progress-indicators/specs
   */
  wavelength?: number
}

export type CircularProgressIndicatorProps = ProgressBarProps &
  RefProps<HTMLDivElement> &
  SharedProps &
  CircularProps

export type CircularProgressIndicatorRenderProps = ProgressBarRenderProps

/**
 * Progress indicators show the status of a process in real time
 *
 * Progress indicators communicate the status of an ongoing process
 *
 * Circular indicators are best when centered in an element.
 *
 * Use progress indicators to show the status of ongoing processes, such as
 * loading an app, submitting a form, or saving updates.
 *
 * When multiple items are loading, use a single progress indicator to show
 * progress for the group. Don’t add progress indicators to every activity.
 *
 * Progress indicators behave differently based on the time of progress being
 * tracked:
 *
 * Determinate: Known progress and wait time
 *
 * Indeterminate: Unknown progress and wait time
 *
 * When using a determinate indicator, the indicator must accurately represent
 * the progress of what it's measuring.
 *
 * Use indeterminate indicators to show that a process is happening, but the
 * wait time is unknown.
 *
 * As more information about a process becomes available, a progress indicator
 * should change from indeterminate to determinate.
 *
 * Determinate progress indicators fill from 0% to 100%
 *
 * Indeterminate progress indicators move along a fixed track, growing and
 * shrinking in size
 *
 * Since the progress indicator is a visual cue, it needs an accessibility label
 * to describe the kind and amount of progress made.
 *
 * Use the progress bar accessibility role, and write an accessibility label that
 * describes the purpose of the progress indicator. The label should include the
 * process, such as "loading,” and the affected content, such as a page,
 * article, or episode. For example: "Loading news article" or "Refreshing
 * page."
 *
 * @see https://m3.material.io/components/progress-indicators/overview
 * @see https://m3.material.io/components/progress-indicators/guidelines
 * @see https://m3.material.io/components/progress-indicators/accessibility
 */
export function CircularProgressIndicator({
  shape = 'flat',
  thickness = 4,
  size,
  amplitude,
  wavelength,
  showTrack = true,
  className,
  style,
  children,
  ref,
  ...props
}: CircularProgressIndicatorProps) {
  const progress = progressOf(props)
  const shown = waveOf(
    shape,
    amplitude ?? wave.amplitude,
    wavelength ?? wave.wavelength,
    thickness,
    wave,
  )
  const natural = ringAcross + thickness
  const across = Math.min(sizeMost, Math.max(sizeLeast, size ?? natural))

  const activeRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const turnRef = useRef<HTMLDivElement>(null)
  const parts = useMemo<Parts>(() => ({ active: activeRef, track: trackRef, turn: turnRef }), [])

  const scene = useMemo<CircularScene>(() => {
    // Everything in the drawing keeps its proportion to the size. The wave rides on the
    // track's center line, so its crests reach past the size by its amplitude.
    const k = across / natural
    const room = shown ? shown.amplitude * k : 0
    return {
      kind: 'circular',
      box: across + 2 * room,
      radius: ((natural - thickness) / 2) * k,
      across,
      thickness: thickness * k,
      gap: gap * k,
      wave: shown ? { amplitude: shown.amplitude * k, wavelength: shown.wavelength * k } : null,
      // A value's wave is Compose's star, at the amplitude's share of the default.
      star: shown
        ? {
            vertices: starVertices(across, thickness * k, shown.wavelength * k),
            share: Math.min(1, shown.amplitude / wave.amplitude),
          }
        : null,
      track: showTrack,
    }
    // The wave is compared by value, through its numbers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [across, natural, thickness, shown?.amplitude, shown?.wavelength, showTrack])

  useMotion(parts, scene, progress)

  // The drawing is known before any effect: its first frame is drawn at once.
  const indeterminate = progress === undefined
  const first = useMemo(
    () =>
      frameOf(
        scene,
        indeterminate
          ? { time: 0, phase: circularPhaseAt(0) }
          : {
              progress: progress ?? 0,
              amplitude: amplitudeFor(progress ?? 0),
              phase: circularPhaseAt(0),
            },
      ),
    // Drawn once, for the first paint; the motion effect takes over from there.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scene, indeterminate],
  )
  const room = (scene.box - across) / 2

  return (
    <ProgressBar
      {...props}
      ref={ref}
      className={composeTailwindRenderProps(className, 'progress-indicator-circular text-primary')}
      style={composeRenderProps(
        style,
        (style) => ({ '--progress-indicator-size': across, ...style }) as CSSProperties,
      )}
    >
      {composeRenderProps(children, (children) => (
        <>
          <div
            ref={turnRef}
            className="progress-indicator-turning"
            style={{
              inset: room ? -room : undefined,
              rotate: first.rotation ? `${first.rotation}deg` : undefined,
            }}
          >
            <div
              ref={trackRef}
              className="progress-indicator-track"
              style={{ clipPath: clip(first.track) }}
            />
            <div
              ref={activeRef}
              className="progress-indicator-active"
              style={{ clipPath: clip(first.active) }}
            />
          </div>
          {children}
        </>
      ))}
    </ProgressBar>
  )
}
