import {
  CalendarHeading as AriaCalendarHeading,
  type CalendarHeadingProps as AriaCalendarHeadingProps,
} from 'react-aria-components'
import { type RefProps } from '../../lib/aria'
import { twMerge } from '../../lib/tv'

// The props of React Aria's CalendarHeading, with the `ref` of the heading it renders.
export type CalendarHeadingProps = AriaCalendarHeadingProps & RefProps<HTMLHeadingElement>

// React Aria's CalendarHeading, the month subhead over a range's month, as Compose's: title-small
// on-surface-variant, in line with its first column's two-digit days, 20dp under what is above it
// and 8dp over its days.
/**
 * Month subhead
 *
 * @see https://m3.material.io/components/date-pickers/specs
 */
export function CalendarHeading({ className, ...props }: CalendarHeadingProps) {
  return <AriaCalendarHeading {...props} className={twMerge('calendar-heading', className)} />
}
