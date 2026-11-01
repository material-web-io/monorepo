import { useContext, useLayoutEffect, useRef, type ComponentProps } from 'react'
import { ms } from '../../lib/motion'
import { twMerge } from '../../lib/tv'
import { PickerContext, PickerDialogContext } from './context'

// The calendar's room and the input's: a date's 392dp or 106dp, a range's as tall as its months,
// as much of that as the picker is given, or the inputs' height, clipped.
const room = {
  date: { picker: 'date-picker-modes', input: 'date-picker-modes-input' },
  range: { picker: 'date-range-picker-modes', input: 'date-range-picker-modes-input' },
}

// The `className`, `style` and children of its `<div>`.
export type DatePickerContentProps = Pick<ComponentProps<'div'>, 'className' | 'style' | 'children'>

// The room under a picker's header that its calendar and input swap in, written in it, growing or
// shrinking to the one shown: DatePickerCalendar and DatePickerInput, or the range's.
export function DatePickerContent({ className, ...props }: DatePickerContentProps) {
  const { displayMode, isRange } = useContext(PickerContext)!
  const container = useContext(PickerDialogContext)
  const ref = useRef<HTMLDivElement>(null)
  // The room's height as last laid out, mid-way through a resize too.
  const height = useRef<number>(undefined)
  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      height.current = entry!.borderBoxSize[0]!.blockSize
    })
    observer.observe(ref.current!)
    return () => observer.disconnect()
  }, [])
  // On a swap, from the height it had to the one it takes, measured, as a range's months take what
  // room is left, on the default spatial spring, as Compose's AnimatedContent sizes its content.
  // A DatePickerDialog around it has its height cap lifted meanwhile, to follow the overshoot too.
  useLayoutEffect(() => {
    const el = ref.current!
    const from = height.current
    if (from === undefined) return
    const to = el.getBoundingClientRect().height
    if (to === from) return
    // The spring read where the room is, so that the motion scheme and reduced motion apply.
    const style = getComputedStyle(el)
    const token = (name: string) =>
      style.getPropertyValue(`--md-sys-motion-spring-default-spatial-${name}`).trim()
    const duration = ms(token('duration'))
    const resize = el.animate(
      { height: [`${from}px`, `${to}px`] },
      { duration, easing: token('easing') },
    )
    const uncap = container?.current?.animate({ maxHeight: ['none', 'none'] }, duration)
    // Started together: a frame under load starts them apart, the cap lifted after the room has
    // let go, which takes a range's whole column of months and drops the scroll to its month.
    void resize.ready.then(
      () => {
        if (uncap) uncap.startTime = resize.startTime
      },
      () => {},
    )
    return () => {
      resize.cancel()
      uncap?.cancel()
    }
  }, [displayMode, container])
  return (
    <div
      ref={ref}
      {...props}
      className={twMerge(room[isRange ? 'range' : 'date'][displayMode], className)}
    />
  )
}
