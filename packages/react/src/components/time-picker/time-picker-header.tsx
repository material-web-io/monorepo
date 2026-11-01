import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'
import { ms } from '../../lib/motion'
import { tv, twMerge } from '../../lib/tv'
import { PickerContext } from './context'
import type { TimePickerDisplayMode } from './helpers'

// The heading's room, which fades it out as its mode leaves and the next one's in once a swap has
// happened; not as the picker first draws.
const title = tv({
  base: '',
  variants: {
    fading: { true: 'time-picker-header-title', false: '' },
    leaving: { true: 'time-picker-header-title-leaving', false: '' },
  },
})

// The `className`, `style` and children of its `<div>`.
export type TimePickerHeaderProps = Pick<ComponentProps<'div'>, 'className' | 'style' | 'children'>

/** The children of a display mode, kept while they fade out as the mode swaps. */
type Leaving = { displayMode: TimePickerDisplayMode; children: ReactNode }

// The header of a TimePicker, holding what the caller writes: React Aria's Heading in the `title`
// slot, which names the dialog it is in, label-medium over the time, as Compose's dialog draws it;
// as the modes swap, the last mode's fades out before the next one's fades in, as the toggle video's.
/**
 * Label (headline)
 *
 * @see https://m3.material.io/components/time-pickers/guidelines
 */
export function TimePickerHeader({ className, children, ...props }: TimePickerHeaderProps) {
  const { displayMode } = useContext(PickerContext)!
  const root = useRef<HTMLDivElement>(null)
  const last = useRef({ displayMode, children })
  // The last mode's children while they fade out, and how many swaps have come in: the room is
  // keyed by it, so that the next mode's children mount fresh and fade in.
  const [swap, setSwap] = useState<{ leaving: Leaving | null; swaps: number }>({
    leaving: null,
    swaps: 0,
  })
  // The mode changed: keep the last mode's children, before anything is painted, while they fade.
  useLayoutEffect(() => {
    const previous = last.current
    last.current = { displayMode, children }
    if (previous.displayMode !== displayMode) setSwap((swap) => ({ ...swap, leaving: previous }))
  }, [displayMode, children])
  // Once they have faded, over the short-2 the stylesheet gives, the mode's own come in.
  useEffect(() => {
    if (!swap.leaving) return
    const fade = ms(
      getComputedStyle(root.current!).getPropertyValue('--md-sys-motion-duration-short2'),
    )
    const timer = setTimeout(
      () => setSwap((swap) => ({ leaving: null, swaps: swap.swaps + 1 })),
      fade,
    )
    return () => clearTimeout(timer)
  }, [swap.leaving])
  return (
    <div {...props} ref={root} className={twMerge('time-picker-header', className)}>
      <div
        key={swap.swaps}
        className={title({ fading: swap.swaps > 0, leaving: swap.leaving !== null })}
      >
        {swap.leaving ? swap.leaving.children : children}
      </div>
    </div>
  )
}
