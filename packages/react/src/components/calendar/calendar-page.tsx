import { Fragment, useContext, type ComponentProps } from 'react'
import { type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { ControlsContext, useCalendarState } from './calendar-controls'

// The page, by the way it slides as the arrows turn it.
const page = tv({
  base: 'calendar-page',
  variants: {
    direction: { forward: 'calendar-page-forward', backward: 'calendar-page-backward' },
  },
})

// The props of the page: a `<div>`'s `className`, `style`, `ref` and children.
export type CalendarPageProps = Pick<ComponentProps<'div'>, 'className' | 'style' | 'children'> &
  RefProps<HTMLDivElement>

// The page the previous and next buttons turn, sliding out as the next slides in, as Compose's
// row of months does, named for the view transition only then. Keyed by its month, so no cell
// carries the last month's colors over; inert while a picker is open over it.
export function CalendarPage({ className, style, children, ref }: CalendarPageProps) {
  const controls = useContext(ControlsContext)
  const state = useCalendarState()
  return (
    <div
      ref={ref}
      inert={!!controls?.picker}
      className={page({ direction: controls?.direction, className })}
      style={{ viewTransitionName: controls?.name, ...style }}
    >
      <Fragment key={state.visibleRange.start.toString()}>{children}</Fragment>
    </div>
  )
}
