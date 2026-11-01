import type { CSSProperties } from 'react'
import {
  composeRenderProps,
  ProgressBar,
  type ProgressBarProps,
  type ProgressBarRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type Except, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'

// The 48dp box in the progressbar role (loading-indicator.css), the container when contained.
const indicator = tv({
  base: 'loading-indicator',
  variants: {
    contained: {
      true: 'rounded-shape-full bg-primary-container text-on-primary-container',
      false: 'text-primary',
    },
  },
  defaultVariants: { contained: false },
})

// The props `LoadingIndicator` adds to React Aria's `ProgressBar` ones. The comments on
// them quote the M3 loading indicator pages, which each comment lists under @see;
// they add no wording of our own.
type LoadingIndicatorBaseProps = {
  /**
   * The container should be visible when the loading indicator is placed over
   * other content. This helps it stand out better by giving it a stronger
   * contrast. It’s not needed when the loading indicator is placed directly on
   * a surface.
   *
   * When the container is visible, the active indicator should change color
   * from primary to on-primary-container.
   *
   * The container should be used with pull-to-refresh behavior.
   *
   * @default false
   * @see https://m3.material.io/components/loading-indicator/guidelines
   * @see https://m3.material.io/components/loading-indicator/specs
   */
  isContained?: boolean

  /**
   * Loading indicators default to 48dp, but the size is flexible. It should be
   * between 24dp to 240dp, depending on the placement and the breakpoint. Avoid
   * exceeding the minimum and maximum sizes.
   *
   * The ratio between the container and the active indicator stays the same
   * when resizing the loading indicator.
   *
   * @default 48
   * @see https://m3.material.io/components/loading-indicator/guidelines
   */
  size?: number
}

// What a progress bar takes for its value: a loading indicator has none, being always
// indeterminate.
type Value = 'value' | 'minValue' | 'maxValue' | 'isIndeterminate' | 'formatOptions' | 'valueLabel'

export type LoadingIndicatorProps = Except<ProgressBarProps, Value> &
  RefProps<HTMLDivElement> &
  LoadingIndicatorBaseProps

export type LoadingIndicatorRenderProps = ProgressBarRenderProps

/**
 * Loading indicators show the progress of a process for a short wait time
 *
 * Loading indicators use animation to grab attention, mitigate perceived
 * latency, and indicate that an activity is in progress.
 *
 * They should be used when progress isn’t detectable, or when it’s not
 * necessary to indicate how long an activity will take.
 *
 * While similar in function to circular progress indicators, loading
 * indicators are a better alternative for short processes between 200ms and
 * 5s.
 *
 * Since the loading indicator is a visual cue, it needs an accessibility label
 * to assist people who can't rely on visuals.
 *
 * It should use the progress bar accessibility role. Write a label describing
 * the purpose of the loading indicator, such as loading news article or
 * refreshing page.
 *
 * @see https://m3.material.io/components/loading-indicator/overview
 * @see https://m3.material.io/components/loading-indicator/guidelines
 * @see https://m3.material.io/components/loading-indicator/accessibility
 */
export function LoadingIndicator({
  isContained = false,
  size,
  className,
  style,
  children,
  ...props
}: LoadingIndicatorProps) {
  return (
    // The size is left to the stylesheet unless asked for, so that a parent can set the
    // property instead.
    <ProgressBar
      {...props}
      isIndeterminate
      className={composeTailwindRenderProps(className, indicator({ contained: isContained }))}
      style={composeRenderProps(style, (style) =>
        size === undefined
          ? style
          : ({ '--loading-indicator-size': size, ...style } as CSSProperties),
      )}
    >
      {composeRenderProps(children, (children) => (
        <>
          <div className="loading-indicator-active" />
          {children}
        </>
      ))}
    </ProgressBar>
  )
}
