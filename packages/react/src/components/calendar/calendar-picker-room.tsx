import {
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type TransitionEvent,
} from 'react'
import { type Key, type Selection } from 'react-aria-components'
import { tv } from '../../lib/tv'
import { ControlsContext, type CalendarPickerKind } from './calendar-controls'

/* The room CalendarYearPicker and CalendarMonthPicker (calendar-year-picker.tsx,
 * calendar-month-picker.tsx) open in over the days. Not exported from the package. */

/* An overlay that comes and goes on CSS transitions: mounted while it is open and until its exit
 * transition ends, and shown a frame after it mounts, so that its entry transition runs. */
function useTransient(isOpen: boolean, ref: RefObject<HTMLElement | null>) {
  const [mounted, setMounted] = useState(isOpen)
  const [shown, setShown] = useState(isOpen)
  if (isOpen && !mounted) setMounted(true)
  if (!isOpen && shown) setShown(false)
  useLayoutEffect(() => {
    if (!isOpen || shown || !ref.current) return
    // The closed styles are computed before the open ones are set, which is what transitions.
    ref.current.getBoundingClientRect()
    setShown(true)
  }, [isOpen, shown, ref])
  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.target === event.currentTarget && !isOpen) setMounted(false)
  }
  return { mounted, shown, onTransitionEnd }
}

// The room a picker opens in over the days, on its way in, open, or on its way out.
const room = tv({
  base: 'calendar-room',
  variants: {
    phase: { entering: '', open: 'calendar-room-open', leaving: 'calendar-room-leaving' },
  },
})

type PickerRoomProps = Pick<ComponentProps<'div'>, 'className' | 'style'> & {
  kind: CalendarPickerKind
  children: ReactNode
}

/* The room a picker opens in over the days, while its menu button has it open and until it has
 * gone; always open in a React Aria calendar not ours, where no menu button opens it. Escape in
 * it closes it alone, not what is around the calendar. */
export function PickerRoom({ kind, className, style, children }: PickerRoomProps) {
  const controls = useContext(ControlsContext)
  const isOpen = controls ? controls.picker === kind : true
  const ref = useRef<HTMLDivElement>(null)
  const transient = useTransient(isOpen, ref)
  if (!transient.mounted) return null
  const phase = transient.shown ? 'open' : isOpen ? 'entering' : 'leaving'
  const escapeCloses = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !controls) return
    event.stopPropagation()
    controls.close()
  }
  return (
    <div
      ref={ref}
      inert={!isOpen}
      className={room({ phase, className })}
      style={style}
      onTransitionEnd={transient.onTransitionEnd}
      onKeyDown={escapeCloses}
    >
      {children}
    </div>
  )
}

/** The key chosen in a single selection, or none. */
export const chosen = (keys: Selection): Key | undefined =>
  keys === 'all' ? undefined : [...keys][0]
