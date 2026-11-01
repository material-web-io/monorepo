import { createContext, useContext, useId, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import {
  ButtonContext,
  CalendarStateContext,
  RangeCalendarStateContext,
  useSlottedContext,
  type PressEvent,
} from 'react-aria-components'

/* What Calendar and RangeCalendar (calendar.tsx, range-calendar.tsx) give the calendar's parts
 * inside React Aria's: the picker open over the days and how the page slides. Not exported from
 * the package: the parts read it. */

type Direction = 'forward' | 'backward'

/** The pickers that open over the days: the months, as the docked date picker has them, or the
 * years. */
export type CalendarPickerKind = 'month' | 'year'

type Controls = {
  // The picker open over the days, if any, which its menu button opens and the picker closes.
  picker: CalendarPickerKind | null
  setPicker: (picker: CalendarPickerKind | null) => void
  close: () => void
  // Whether `picker` was the last to close, answered once: its menu button takes the focus back.
  takeClosed: (picker: CalendarPickerKind) => boolean
  // The menu buttons by the picker they open, which Shift+M and Shift+Y focus.
  register: (picker: CalendarPickerKind, button: HTMLElement) => () => void
  buttonFor: (picker: CalendarPickerKind) => HTMLElement | undefined
  // The way the page slides, and its view transition name while it slides.
  direction: Direction
  name: string | undefined
}

export const ControlsContext = createContext<Controls | null>(null)

/** The state of the Calendar or RangeCalendar a part is in, as React Aria provides it. */
export function useCalendarState() {
  const single = useContext(CalendarStateContext)
  const range = useContext(RangeCalendarStateContext)
  const state = single ?? range
  if (!state) throw new Error('A calendar part must be in a Calendar or a RangeCalendar.')
  return state
}

/* Runs `update` as a view transition of the type calendar-page, when the browser has them typed
 * and motion is not reduced, after `before`, so that the page it changes slides out as the next
 * slides in, the rest left out of it and pressed meanwhile (calendar.css); else at once. */
function transition(element: Element | null, update: () => void, before: () => void) {
  const doc = element?.ownerDocument
  const view = doc?.defaultView
  if (!doc?.startViewTransition || !view) return void update()
  const typed = view.CSS.supports('selector(:active-view-transition-type(calendar-page))')
  const reduced = view.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!typed || reduced) return void update()
  before()
  return doc.startViewTransition({ update: () => flushSync(update), types: ['calendar-page'] })
}

/* Gives the calendar's parts the controls, inside React Aria's Calendar or RangeCalendar, and its
 * previous and next buttons a slide: the direction and the page's name are set first, so that the
 * page is captured with them, then React Aria's press turns the page in the view transition. */
export function ControlsProvider({ children }: { children: ReactNode }) {
  const [picker, setPicker] = useState<CalendarPickerKind | null>(null)
  const [direction, setDirection] = useState<Direction>('forward')
  // The slides running, a slide pressed over another ending that one: the page is named only
  // while its own run, so that the other calendars on the page stay out of them.
  const [slides, setSlides] = useState(0)
  const id = `calendar-page-${useId().replace(/\W/g, '')}`
  const closed = useRef<CalendarPickerKind | null>(null)
  const buttons = useRef<Partial<Record<CalendarPickerKind, HTMLElement>>>({})
  const previous = useSlottedContext(ButtonContext, 'previous')
  const next = useSlottedContext(ButtonContext, 'next')
  const withSlide = (button: typeof previous, to: Direction) => ({
    ...button,
    onPress: (event: PressEvent) => {
      flushSync(() => setDirection(to))
      const started = transition(
        event.target,
        () => button?.onPress?.(event),
        () => flushSync(() => setSlides((count) => count + 1)),
      )
      const ended = () => setSlides((count) => count - 1)
      void started?.finished.then(ended, ended)
    },
  })
  const close = () => {
    closed.current = picker
    setPicker(null)
  }
  const takeClosed = (kind: CalendarPickerKind) => {
    if (closed.current !== kind) return false
    closed.current = null
    return true
  }
  const register = (kind: CalendarPickerKind, button: HTMLElement) => {
    buttons.current[kind] = button
    return () => {
      if (buttons.current[kind] === button) delete buttons.current[kind]
    }
  }
  // The button of a picker, or the other's when there is none of its own.
  const buttonFor = (kind: CalendarPickerKind) =>
    buttons.current[kind] ?? buttons.current[kind === 'month' ? 'year' : 'month']
  const slots = { previous: withSlide(previous, 'backward'), next: withSlide(next, 'forward') }
  const name = slides > 0 ? id : undefined
  return (
    <ButtonContext.Provider value={{ slots }}>
      <ControlsContext.Provider
        value={{ picker, setPicker, close, takeClosed, register, buttonFor, direction, name }}
      >
        {children}
      </ControlsContext.Provider>
    </ButtonContext.Provider>
  )
}
