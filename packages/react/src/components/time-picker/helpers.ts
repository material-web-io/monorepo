import type { ReactNode } from 'react'

/* What TimePicker (time-picker.tsx) and its parts share: the modes, the selection and the dial's
 * geometry, as Compose's TimePicker has them. Not exported from the package but the types. */

/** The dial or the time input, as Compose's `TimePickerDisplayMode` names them. */
export type TimePickerDisplayMode = 'picker' | 'input'

/** The dial under the time or beside it, as Compose's `TimePickerLayoutType` names them. */
export type TimePickerLayout = 'vertical' | 'horizontal'

/** The part of the time the dial sets, as Compose's `TimePickerSelectionMode` names them. */
export type TimePickerSelection = 'hour' | 'minute'

/** What a picker's function children are called with: the display mode and the selection, which
 * the text the caller writes in its parts can follow. */
export type TimePickerRenderProps = {
  displayMode: TimePickerDisplayMode
  selection: TimePickerSelection
}

/** Calls a picker's children with its render props when they are a function. */
export const renderChildren = (
  children: ReactNode | ((values: TimePickerRenderProps) => ReactNode),
  values: TimePickerRenderProps,
) => (typeof children === 'function' ? children(values) : children)

/**
 * The dial's geometry in dp, as Compose draws it: 256dp across, the numbers 101dp from the center,
 * the extra hours of a 24-hour dial 69dp, and a press 74dp or further from the center on the outer
 * ring.
 */
export const dial = { size: 256, outer: 101, inner: 69, boundary: 74 }

/** The angle of a point `x`, `y` from the dial's center: clockwise from 12 o'clock, in [0, 360). */
export function angleOf(x: number, y: number) {
  return ((Math.atan2(x, -y) * 180) / Math.PI + 360) % 360
}

/** The angle `to`, past as many turns as puts it within half a turn of `from`: where the hand turns
 * to from `from` the short way round, as Compose's `endValueForAnimation` turns it. */
export function turnTo(from: number, to: number) {
  return to + 360 * Math.round((from - to) / 360)
}

/** The number of the ring nearest the angle: of twelve around it, the first at 12 o'clock. */
export const nearest = (angle: number) => Math.round(angle / 30) % 12
