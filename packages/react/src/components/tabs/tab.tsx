import { useContext, useLayoutEffect, useRef, type ReactNode } from 'react'
import type { Orientation } from 'react-aria'
import {
  Tab as AriaTab,
  composeRenderProps,
  type TabProps as AriaTabProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { ms } from '../../lib/motion'
import { tv } from '../../lib/tv'
import { Ripple } from '../ripple'
import { TabsContext, type TabsContextValue } from './context'

export type { TabRenderProps } from 'react-aria-components'

// The parts' own classes are in tabs.css; these are what a variant adds. Selected, a tab's label
// and icon keep its variant's color while hovered, focused or pressed.
const tab = tv({
  base: 'group/md-tab tab',
  variants: {
    variant: { primary: 'selected:text-primary', secondary: 'selected:text-on-surface' },
  },
})

// The content (tabs.css), its children drawn in it as written: a primary tab stacks its icon over
// its label, a secondary tab puts them 8dp apart. 10dp below it, the 1dp over a row's divider
// counted in; a column's divider is at its side.
const content = tv({
  base: 'tab-content',
  variants: {
    variant: { primary: 'flex-col', secondary: 'flex-row gap-space-100' },
    orientation: { horizontal: 'mb-px pb-space-100-variable', vertical: 'pb-space-125-variable' },
  },
})

// The focus indicator (tabs.css) at the tab's edges, 4dp from the divider.
const focusIndicator = tv({
  base: 'tab-focus-indicator',
  variants: {
    orientation: {
      horizontal: 'inset-x-0 top-0 bottom-1',
      vertical: 'inset-y-0 start-0 end-1',
    },
  },
})

// In a row, primary, 3dp with round top corners at the bottom of the content; secondary, 2dp
// across the tab. In a column, at the tab's inline end: primary, 3dp with round start corners
// from 2dp inside each end of the content to the other; secondary, 2dp along the tab.
const indicator = tv({
  base: 'tab-indicator',
  variants: {
    variant: { primary: '', secondary: '' },
    orientation: { horizontal: '', vertical: 'end-0' },
  },
  compoundVariants: [
    {
      variant: 'primary',
      orientation: 'horizontal',
      class: 'tab-indicator-primary -bottom-px h-0.75 rounded-t-full',
    },
    { variant: 'secondary', orientation: 'horizontal', class: 'inset-x-0 bottom-0 h-0.5' },
    {
      variant: 'primary',
      orientation: 'vertical',
      class: 'inset-y-space-150-variable w-0.75 rounded-s-full',
    },
    { variant: 'secondary', orientation: 'vertical', class: 'inset-y-0 w-0.5' },
  ],
})

/* Slides `to`, the indicator of the tab just selected, in from where `from`, the one before it,
 * is: each edge along the tabs, left and right in a row, top and bottom in a column, over its own
 * duration (tabs.css), the one toward the new tab ahead of the other. */
function slide(from: HTMLElement, to: HTMLElement, orientation: Orientation) {
  const start = from.getBoundingClientRect()
  const end = to.getBoundingClientRect()
  const block = to.offsetParent?.getBoundingClientRect()
  // Nothing to slide between before a layout, as in jsdom, where every rect is empty.
  if (!start.width || !end.width || !block) return
  const style = getComputedStyle(to)
  const easing = style.getPropertyValue('--tab-indicator-easing').trim() || undefined
  const lead = ms(style.getPropertyValue('--tab-indicator-lead'))
  const trail = ms(style.getPropertyValue('--tab-indicator-trail'))
  // A slide this one interrupts stops where it is, which is where this one starts.
  from.getAnimations().forEach((animation) => animation.cancel())
  const [head, tail, size] =
    orientation === 'vertical'
      ? (['top', 'bottom', 'height'] as const)
      : (['left', 'right', 'width'] as const)
  const forward = end[head] + end[size] / 2 > start[head] + start[size] / 2
  to.animate(
    { [head]: [`${start[head] - block[head]}px`, `${end[head] - block[head]}px`] },
    { duration: forward ? trail : lead, easing },
  )
  to.animate(
    { [tail]: [`${block[tail] - start[tail]}px`, `${block[tail] - end[tail]}px`] },
    { duration: forward ? lead : trail, easing },
  )
}

/* Scrolls a scrollable list to put `tab` in its middle, as far as it scrolls: across a row, or up
 * and down a column. The same sum in rtl, where the tabs past the start lie at negative offsets
 * and the scroll position runs down to them. */
function center(tab: HTMLElement, orientation: Orientation, behavior: ScrollBehavior) {
  const list = tab.closest<HTMLElement>('[role="tablist"]')
  list?.scrollTo(
    orientation === 'vertical'
      ? { top: tab.offsetTop + (tab.offsetHeight - list.clientHeight) / 2, behavior }
      : { left: tab.offsetLeft + (tab.offsetWidth - list.clientWidth) / 2, behavior },
  )
}

/* What a tab draws: its state layer and ripple, focus indicator, content and active indicator.
 * Selected, it takes the indicator over from the tab selected before it and slides it in, and a
 * scrollable list scrolls to it; React Aria scrolls a tab the keyboard focuses into view itself. */
function TabContent({
  isSelected,
  variant,
  orientation,
  setIndicator,
  children,
}: TabsContextValue & { isSelected: boolean; children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const host = el?.closest<HTMLElement>('[role="tab"]')
    if (!isSelected || !el || !host) return
    const from = setIndicator(el)
    if (from && from !== el) slide(from, el, orientation)
    // On mount, a scrollable list opens on the selected tab. A tab selected later is centered a
    // frame after: React Aria sets the scroll position back as the press's focus enters the list.
    if (!from) {
      center(host, orientation, 'instant')
      return
    }
    const frame = requestAnimationFrame(() => center(host, orientation, 'auto'))
    return () => cancelAnimationFrame(frame)
  }, [isSelected, orientation, setIndicator])

  const activeIndicator = (
    <span aria-hidden ref={ref} className={indicator({ variant, orientation })} />
  )
  // Only a primary tab's indicator in a row is drawn in the content, whose width it takes.
  const inContent = variant === 'primary' && orientation === 'horizontal'
  return (
    <>
      <Ripple variant={variant === 'primary' ? 'primary' : 'on-surface'} />
      <span aria-hidden className={focusIndicator({ orientation })} />
      <span className={content({ variant, orientation })}>
        {children}
        {inContent && activeIndicator}
      </span>
      {!inContent && activeIndicator}
    </>
  )
}

// React Aria's Tab props, with the `ref` of the element it renders: its `id`, which its
// `TabPanel` names, `isDisabled`, and `href`, which makes it a link. Its children are drawn as
// written: its label is its text, and an `Icon` takes the tab's size and colors.
export type TabProps = AriaTabProps & RefProps<HTMLDivElement>

// React Aria's Tab, a <div> in the tab role or an <a> given an href, which takes every prop as it
// does. Its variant is its Tabs'.
/**
 * To differentiate an active tab from an inactive tab, apply an underline and color
 * change to the active tab’s text and icon.
 *
 * By default, tabs inherit enabled states with one active state.The inactive and active
 * states of a tab can inherit a hover, focus, and pressed states.
 *
 * Tab labels can include icons and text. Text labels should be short.
 *
 * Icons communicate the kind of content within a tab. Icons should be simple and
 * recognizable.
 *
 * Text labels should clearly and succinctly describe the content within the tab.
 *
 * Tab labels appear in a single row. Labels can use a second line if needed, with
 * truncated text.
 *
 * Don’t use tabs with both icons and text labels on only some tabs, but not others
 *
 * Navigate to a tab by tapping on it.
 *
 * To select an individual tab, users tap or press space/enter.
 *
 * When the visible UI text is ambiguous, or there is no visible UI text, accessibility
 * labels need to be more descriptive.
 *
 * @see https://m3.material.io/components/tabs/guidelines
 * @see https://m3.material.io/components/tabs/accessibility
 */
export function Tab({ className, children, ...props }: TabProps) {
  const tabs = useContext(TabsContext)
  return (
    <AriaTab
      {...props}
      className={composeTailwindRenderProps(className, tab({ variant: tabs.variant }))}
    >
      {composeRenderProps(children, (children, { isSelected }) => (
        <TabContent {...tabs} isSelected={isSelected}>
          {children}
        </TabContent>
      ))}
    </AriaTab>
  )
}
