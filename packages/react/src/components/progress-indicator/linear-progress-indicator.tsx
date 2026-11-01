import { useMemo, useRef, type CSSProperties } from 'react'
import { mergeRefs } from 'react-aria'
import {
  composeRenderProps,
  ProgressBar,
  type ProgressBarProps,
  type ProgressBarRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { useMeasuredWidth } from '../../lib/use-measured-width'
import { type LinearScene } from './motion'
import { gap, progressOf, useMotion, waveOf, type Parts, type SharedProps } from './shared'

// The spec's measurements, in dp: the stop indicator, and the wave at rest and while indeterminate.
const stopSize = 4
const stopTrailingMost = 6
const wave = { amplitude: 3, wavelength: 40, indeterminateWavelength: 20 }

type LinearProps = {
  /**
   * Wavy indicators use amplitude and wavelength to determine the shape of the
   * wave. The height is the overall container height.
   *
   * Amplitude measures from the center of the resting position to the center of
   * the peak
   *
   * @default 3
   * @see https://m3.material.io/components/progress-indicators/specs
   */
  amplitude?: number
  /**
   * Wavy indicators use amplitude and wavelength to determine the shape of the
   * wave. The height is the overall container height.
   *
   * Wavelength measures the distance between two adjacent peaks
   *
   * @default 40, or 20 while indeterminate
   * @see https://m3.material.io/components/progress-indicators/specs
   */
  wavelength?: number
  /**
   * The stop indicator is a 4dp circle that marks the end of a linear
   * determinate progress indicator to meet Material's accessibility standards.
   *
   * It's not used for indeterminate or circular progress indicators.
   *
   * The stop indicator is required if the track has a contrast below 3:1 with
   * its container or the surface behind the container.
   *
   * Only remove the end stop indicator if there's a visual contrast of at least
   * 3:1 with surrounding surfaces
   *
   * @default true
   * @see https://m3.material.io/components/progress-indicators/guidelines
   */
  showStopIndicator?: boolean
}

export type LinearProgressIndicatorProps = ProgressBarProps &
  RefProps<HTMLDivElement> &
  SharedProps &
  LinearProps

export type LinearProgressIndicatorRenderProps = ProgressBarRenderProps

/**
 * Progress indicators show the status of a process in real time
 *
 * Progress indicators communicate the status of an ongoing process
 *
 * Linear indicators are best when placed on the edge of a container.
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
export function LinearProgressIndicator({
  shape = 'flat',
  thickness = 4,
  amplitude = wave.amplitude,
  wavelength,
  showStopIndicator = true,
  showTrack = true,
  className,
  style,
  children,
  ref,
  ...props
}: LinearProgressIndicatorProps) {
  const progress = progressOf(props)
  const determinate = progress !== undefined
  const atRest = determinate ? wave.wavelength : wave.indeterminateWavelength
  const shown = waveOf(shape, amplitude, wavelength ?? atRest, thickness, {
    amplitude: wave.amplitude,
    wavelength: atRest,
  })
  const stop = determinate && showStopIndicator

  const { ref: rootRef, width } = useMeasuredWidth<HTMLDivElement>('linear')
  const activeRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const stopRef = useRef<HTMLDivElement>(null)
  const parts = useMemo<Parts>(() => ({ active: activeRef, track: trackRef, stop: stopRef }), [])

  const scene = useMemo<LinearScene | null>(() => {
    if (width === undefined) return null
    // The dot is set in from the end as Compose sets it: the flat indicator centers it on a
    // thicker track up to the trailing space, the wavy one keeps it a quarter thickness in.
    const dot = Math.min(thickness, stopSize)
    const trailing = shown
      ? dot === thickness
        ? 0
        : thickness / 4
      : Math.min((thickness - dot) / 2, stopTrailingMost)
    return {
      kind: 'linear',
      width,
      thickness,
      gap,
      wave: shown,
      track: showTrack,
      stop: stop ? { size: dot, trailing } : null,
    }
    // The wave is compared by value below, through the scene's key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, thickness, shown?.amplitude, shown?.wavelength, showTrack, stop])

  useMotion(parts, scene, progress)

  const empty = 'path("M0 0Z")'
  const height = thickness + (shown ? 2 * shown.amplitude : 0)

  return (
    <ProgressBar
      {...props}
      ref={mergeRefs(rootRef, ref)}
      className={composeTailwindRenderProps(className, 'progress-indicator-linear text-primary')}
      style={composeRenderProps(
        style,
        (style) => ({ '--progress-indicator-height': height, ...style }) as CSSProperties,
      )}
    >
      {composeRenderProps(children, (children) => (
        <>
          <div ref={trackRef} className="progress-indicator-track" style={{ clipPath: empty }} />
          <div ref={activeRef} className="progress-indicator-active" style={{ clipPath: empty }} />
          {stop && (
            <div
              ref={stopRef}
              className="progress-indicator-stop"
              style={{ clipPath: 'circle(0px at 0px 0px)' }}
            />
          )}
          {children}
        </>
      ))}
    </ProgressBar>
  )
}
