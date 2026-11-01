import { useContext, useRef, type CSSProperties, type ReactNode } from 'react'
import { useLocale } from 'react-aria'
import {
  composeRenderProps,
  Slider as AriaSlider,
  SliderStateContext,
  SliderThumb,
  SliderTrack,
  type SliderProps as AriaSliderProps,
  type SliderThumbProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv, twMerge, type VariantProps } from '../../lib/tv'

/* React Aria's Slider, a <div> in the group role, the named group its parts style from
 * (group-disabled/md-slider:); in it the caller's children, then its SliderTrack, which draws the
 * track and holds a SliderThumb per value. Their fixed classes are in slider.css. */

const slider = tv({
  base: 'group/md-slider slider',
  variants: {
    orientation: {
      horizontal: 'flex flex-col',
      vertical: 'inline-flex flex-col items-center',
    },
    size: {
      xs: 'slider-size-xs',
      s: 'slider-size-s',
      m: 'slider-size-m',
      l: 'slider-size-l',
      xl: 'slider-size-xl',
    },
  },
  defaultVariants: { orientation: 'horizontal', size: 'xs' },
})

type Size = NonNullable<VariantProps<typeof slider>['size']>
type Orientation = 'horizontal' | 'vertical'

// The way a value runs along the track, from React Aria's locale as its thumbs are placed: the
// stretches, stops and icon are laid along it from that start.
type Axis = 'ltr' | 'rtl' | 'vertical'

const track = { horizontal: 'slider-track-horizontal', vertical: 'slider-track-vertical' }
const segment = {
  ltr: 'slider-segment-ltr',
  rtl: 'slider-segment-rtl',
  vertical: 'slider-segment-vertical',
}
const stop = { ltr: 'slider-stop-ltr', rtl: 'slider-stop-rtl', vertical: 'slider-stop-vertical' }
const iconAxis = {
  ltr: 'slider-icon-ltr',
  rtl: 'slider-icon-rtl',
  vertical: 'slider-icon-vertical',
}
const iconCopy = { active: 'slider-icon-active', inactive: 'slider-icon-inactive' }
const iconReveal = {
  horizontal: 'slider-icon-reveal-horizontal',
  vertical: 'slider-icon-reveal-vertical',
}
const thumb = { horizontal: 'slider-thumb-horizontal', vertical: 'slider-thumb-vertical' }
const handle = { horizontal: 'slider-handle-horizontal', vertical: 'slider-handle-vertical' }
const indicator = {
  horizontal: 'slider-value-indicator-horizontal',
  vertical: 'slider-value-indicator-vertical',
}

// What every thumb's hidden <input> is submitted as: a range slider's two values go under the one
// name, the start first.
type InputProps = Pick<SliderThumbProps, 'name' | 'form'>

// The first two thumbs are named peers, whose held or focused state narrows the gap the stretches
// after them leave around them (slider.css); a range slider has no more.
const peers = ['peer/md-slider-thumb-0', 'peer/md-slider-thumb-1']

// A stretch of the track: its color, its two ends (slider.css's names for where a thumb's gap
// begins or ends, the center's 2dp either side, or the track's ends) and their corners, and which
// copy of an inset icon it holds.
type Segment = {
  active: boolean
  from: string
  to: string
  fromCorner: string
  toCorner: string
  icon?: 'active' | 'inactive'
}

const outer = 'var(--slider-track-corner)'
const inner = 'var(--slider-inner-corner)'

// The stretches of each variant, from the start: a centered slider's active track runs from the
// center to its value, on whichever side that is.
const layouts: Record<'standard' | 'range' | 'centeredAfter' | 'centeredBefore', Segment[]> = {
  standard: [
    {
      active: true,
      from: '0px',
      to: 'var(--slider-before-0)',
      fromCorner: outer,
      toCorner: inner,
      icon: 'active',
    },
    {
      active: false,
      from: 'var(--slider-after-0)',
      to: '100%',
      fromCorner: inner,
      toCorner: outer,
      icon: 'inactive',
    },
  ],
  range: [
    {
      active: false,
      from: '0px',
      to: 'var(--slider-before-0)',
      fromCorner: outer,
      toCorner: inner,
    },
    {
      active: true,
      from: 'var(--slider-after-0)',
      to: 'var(--slider-before-1)',
      fromCorner: inner,
      toCorner: inner,
    },
    {
      active: false,
      from: 'var(--slider-after-1)',
      to: '100%',
      fromCorner: inner,
      toCorner: outer,
    },
  ],
  centeredAfter: [
    {
      active: false,
      from: '0px',
      to: 'min(var(--slider-center-before), var(--slider-before-0))',
      fromCorner: outer,
      toCorner: inner,
    },
    {
      active: true,
      from: 'var(--slider-center-after)',
      to: 'var(--slider-before-0)',
      fromCorner: inner,
      toCorner: inner,
    },
    {
      active: false,
      from: 'var(--slider-after-0)',
      to: '100%',
      fromCorner: inner,
      toCorner: outer,
    },
  ],
  centeredBefore: [
    {
      active: false,
      from: '0px',
      to: 'var(--slider-before-0)',
      fromCorner: outer,
      toCorner: inner,
    },
    {
      active: true,
      from: 'var(--slider-after-0)',
      to: 'var(--slider-center-before)',
      fromCorner: inner,
      toCorner: inner,
    },
    {
      active: false,
      from: 'max(var(--slider-center-after), var(--slider-after-0))',
      to: '100%',
      fromCorner: inner,
      toCorner: outer,
    },
  ],
}

// Custom properties, which React's CSSProperties does not list.
function vars(values: Record<string, string | number>) {
  return values as CSSProperties
}

// A handle, with the value indicator above it. React Aria moves it a step on an arrow key, ten
// percent of the range on Page Up or Down or Shift and an arrow; the spec's Space and an arrow is
// added here, with React Aria's page size as the interval.
function Thumb({
  index,
  orientation,
  showValueIndicator,
  name,
  form,
}: InputProps & {
  index: number
  orientation: Orientation
  showValueIndicator: boolean | undefined
}) {
  const state = useContext(SliderStateContext)!
  const { direction } = useLocale()
  const space = useRef(false)
  return (
    <SliderThumb
      index={index}
      name={name}
      form={form}
      className={twMerge(
        'group/md-slider-thumb',
        peers[index] ?? '',
        'slider-thumb',
        thumb[orientation],
      )}
      onKeyDown={(event) => {
        if (event.key === ' ') {
          // Held, it makes the arrows take larger steps; it would scroll the page otherwise.
          space.current = true
          event.preventDefault()
          return
        }
        // As React Aria's arrows go: up and the reading direction's forward increase it.
        const forward = direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
        const backward = direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
        const sign =
          event.key === 'ArrowUp' || event.key === forward
            ? 1
            : event.key === 'ArrowDown' || event.key === backward
              ? -1
              : 0
        if (!space.current || sign === 0) {
          event.continuePropagation()
          return
        }
        event.preventDefault()
        // Dragged for the change, as React Aria's own keys do, so onChangeEnd follows it.
        state.setThumbDragging(index, true)
        if (sign > 0) state.incrementThumb(index, state.pageSize)
        else state.decrementThumb(index, state.pageSize)
        state.setThumbDragging(index, false)
      }}
      onKeyUp={(event) => {
        if (event.key === ' ') space.current = false
        event.continuePropagation()
      }}
      onBlur={() => {
        space.current = false
      }}
    >
      <span className={twMerge('slider-handle', handle[orientation])} />
      {showValueIndicator && (
        <span aria-hidden className={twMerge('slider-value-indicator', indicator[orientation])}>
          {state.getThumbValueLabel(index)}
        </span>
      )}
    </SliderThumb>
  )
}

// The track: React Aria's SliderTrack, the handles' travel, which takes a press anywhere on it, its
// thumbs first, as peers of the stretches after them, then the stretches, each the whole track
// clipped to where it runs, with its stops and inset icon in it.
function Track({
  orientation,
  isCentered,
  showStops,
  showValueIndicator,
  icon,
  name,
  form,
}: SliderBaseProps & InputProps & { orientation: Orientation }) {
  const { direction } = useLocale()
  const axis: Axis = orientation === 'vertical' ? 'vertical' : direction
  return (
    <SliderTrack
      className={twMerge('slider-track', track[orientation])}
      style={({ state }) =>
        vars(
          Object.fromEntries(
            state.values.map((_, index) => [
              `--slider-value-${index}`,
              state.getThumbPercent(index),
            ]),
          ),
        )
      }
    >
      {({ state }) => {
        const count = state.values.length
        const layout =
          count > 1
            ? 'range'
            : isCentered
              ? state.getThumbPercent(0) >= 0.5
                ? 'centeredAfter'
                : 'centeredBefore'
              : 'standard'
        // Every step's stop, or the end stops alone: the inactive track's end, and a centered or
        // range slider's start as well. The track's end always has one.
        const min = state.getThumbMinValue(0)
        const max = state.getThumbMaxValue(count - 1)
        const steps = Math.floor((max - min) / state.step + 1e-9)
        const every = Array.from({ length: steps + 1 }, (_, step) =>
          state.getValuePercent(min + step * state.step),
        )
        if ((every.at(-1) ?? 0) < 1) every.push(1)
        const ends = layout === 'standard' ? [1] : [0, 1]
        return (
          <>
            {state.values.map((_, index) => (
              <Thumb
                key={index}
                index={index}
                orientation={orientation}
                showValueIndicator={showValueIndicator}
                name={name}
                form={form}
              />
            ))}
            {layouts[layout].map((part, index) => (
              <span
                key={index}
                aria-hidden
                className={twMerge(
                  'slider-segment',
                  segment[axis],
                  part.active ? 'slider-active-track' : 'slider-inactive-track',
                )}
                style={vars({
                  '--slider-from': part.from,
                  '--slider-to': part.to,
                  '--slider-from-corner': part.fromCorner,
                  '--slider-to-corner': part.toCorner,
                })}
              >
                {(showStops ? every : part.active ? [] : ends).map((at) => (
                  <span
                    key={at}
                    className={twMerge('slider-stop', stop[axis])}
                    style={vars({ '--slider-stop': at })}
                  />
                ))}
                {icon !== undefined && part.icon && (
                  <span className={twMerge(iconCopy[part.icon], iconReveal[orientation])}>
                    <span className={twMerge('slider-icon', iconAxis[axis])}>{icon}</span>
                  </span>
                )}
              </span>
            ))}
          </>
        )
      }}
    </SliderTrack>
  )
}

// The props `Slider` adds to those of React Aria's Slider. The comments on them quote the M3
// slider pages, which each comment lists under @see; they add no wording of our own.
type SliderBaseProps = {
  /**
   * Sliders come in different sizes: XS, S, M, L, and XL. Use larger sizes to
   * increase the targets and provide a larger visual emphasis.
   *
   * The active and inactive tracks should always be the same size.
   *
   * - `xs`: 16dp
   * - `s`: 24dp
   * - `m`: 40dp
   * - `l`: 56dp
   * - `xl`: 96dp
   *
   * XL sliders should be reserved for hero moments, where the slider itself is
   * the most important element on the page.
   *
   * @default 'xs'
   * @see https://m3.material.io/components/sliders/guidelines
   * @see https://m3.material.io/components/sliders/specs
   */
  size?: Size

  // A single value only: a range slider ignores it.
  /**
   * Centered sliders select a value from a positive and negative value range.
   * Use this when zero, or the default value, is in the middle of the range.
   *
   * @default false
   * @see https://m3.material.io/components/sliders/guidelines
   */
  isCentered?: boolean

  // A stop at every `step` from `minValue`. The end stops are drawn either way.
  /**
   * Stop indicators show which predetermined values can be chosen on the slider.
   * The slider handle snaps to the closest stop.
   *
   * Avoid having too many stop indicators on a slider, because it can become
   * visually crowded and difficult to adjust the value.
   *
   * @default false
   * @see https://m3.material.io/components/sliders/guidelines
   */
  showStops?: boolean

  // Shown while its handle is held or dragged, or has keyboard focus, as the specs' states draw it;
  // the text is React Aria's value label, formatted by `formatOptions`.
  /**
   * The value displays the specific value that corresponds with the handle’s
   * placement.
   *
   * A value appears when interacting with the corresponding handle. For range
   * sliders, only one value should be shown at a time.
   *
   * If the value is shown elsewhere, the indicator is not required.
   *
   * @default false
   * @see https://m3.material.io/components/sliders/guidelines
   */
  showValueIndicator?: boolean

  // Drawn on a standard slider only; an `Icon` in it is sized to the slider, 24dp or 32dp at XL.
  /**
   * Standard sliders that are M, L, or XL can include an icon within the track.
   * This icon should illustrate what the slider controls. Avoid adding inset
   * icons to XS or S sliders.
   *
   * When there’s not enough space for the icon on the active track, like at a
   * low value, the icon moves to the inactive track.
   *
   * Consider swapping which icon is displayed at zero, like a volume icon
   * becoming a mute icon.
   *
   * Don’t use inset icons on centered or range sliders. It makes it unclear where
   * the start of the slider is.
   *
   * @see https://m3.material.io/components/sliders/guidelines
   */
  icon?: ReactNode
}

// What a slider passes its children and className, given as functions: the state React Aria
// reports of it.
export type { SliderRenderProps } from 'react-aria-components'

// The props of React Aria's Slider, which `Slider` is, with the `ref` of its `<div>`, its thumbs'
// `name` and `form`, and the M3 props: `value`, `defaultValue` and `onChange` take a number, or an
// array of two for a range slider. Its children (a `Label`, a `SliderOutput`) precede the track.
export type SliderProps<T extends number | number[] = number | number[]> = AriaSliderProps<T> &
  InputProps &
  RefProps<HTMLDivElement> &
  SliderBaseProps

// A thumb's hidden <input type="range"> is what has the slider role and the focus; it is named by
// the slider's `Label` child or its `aria-label`, and submitted under its `name`. A vertical slider
// takes its length from its own height, which the caller gives it.
/**
 * Sliders allow users to make selections from a range of values
 *
 * Sliders are used to select values along a track. They’re ideal for adjusting
 * settings such as volume and brightness, or changing the intensity of image
 * filters.
 *
 * Changes made with sliders must take effect immediately, so people can
 * understand the effects of their selection as they're moving the slider.
 *
 * Standard sliders select one value from a range of values. Use this when the
 * slider should start from zero or the beginning of a sequence.
 *
 * Range sliders select two values on one slider to create a range. Use this
 * when defining a minimum and maximum value.
 *
 * Avoid using range sliders vertically, as this can add too much cognitive
 * load. People are used to most sliders being horizontal.
 *
 * Keyboard navigation:
 * - Tab: Moves focus to the slider handle
 * - Arrows: Increase and decrease the value by one value or one stop indicator
 * - Space & Arrows: Increase and decrease the value by one interval or one stop
 *   indicator
 * - Home or End: Set the slider to the first and last values on the slider
 *
 * The accessibility label for a slider is typically the same as the slider's
 * adjacent text label. It should have the slider role.
 *
 * @see https://m3.material.io/components/sliders/overview
 * @see https://m3.material.io/components/sliders/guidelines
 * @see https://m3.material.io/components/sliders/accessibility
 */
export function Slider<T extends number | number[]>({
  size,
  isCentered,
  showStops,
  showValueIndicator,
  icon,
  name,
  form,
  className,
  children,
  ...props
}: SliderProps<T>) {
  const orientation = props.orientation ?? 'horizontal'
  return (
    <AriaSlider
      {...props}
      className={composeTailwindRenderProps(className, slider({ orientation, size }))}
    >
      {composeRenderProps(children, (children) => (
        <>
          {children}
          <Track
            orientation={orientation}
            isCentered={isCentered}
            showStops={showStops}
            showValueIndicator={showValueIndicator}
            icon={icon}
            name={name}
            form={form}
          />
        </>
      ))}
    </AriaSlider>
  )
}
