import { useContext } from 'react'
import {
  TabList as AriaTabList,
  type TabListProps as AriaTabListProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { TabsContext } from './context'

/* Tabs on the surface (tab.tsx) and the 1dp divider they sit on. A row, fixed, is divided equally;
 * scrollable, it scrolls sideways, its tabs as wide as their content and 52dp from its ends. A column,
 * as wide as its widest tab, has the divider at its inline end and scrolls up and down. */
const list = tv({
  base: 'relative box-border flex border-outline-variant bg-surface',
  variants: {
    orientation: {
      horizontal: 'border-b',
      vertical: 'flex-col border-e *:flex-none',
    },
    scrollable: {
      true: 'scrollbar-hidden scroll-smooth motion-reduce:scroll-auto',
      false: '',
    },
  },
  compoundVariants: [
    { orientation: 'horizontal', scrollable: false, class: '*:flex-1 *:basis-0' },
    {
      orientation: 'horizontal',
      scrollable: true,
      class: 'overflow-x-auto overflow-y-hidden ps-tab-list-offset pe-tab-list-offset *:flex-none',
    },
    { orientation: 'vertical', scrollable: true, class: 'overflow-x-hidden overflow-y-auto' },
  ],
  defaultVariants: { orientation: 'horizontal', scrollable: false },
})

export type { TabListRenderProps } from 'react-aria-components'

// The props `TabList` adds to those of React Aria's TabList. The comments on them quote
// the M3 tabs pages, which each comment lists under @see; they add no wording of our own.
type TabListBaseProps = {
  // Scrollable, each tab is as wide as its content and the list scrolls to the selected
  // or focused tab, centered; fixed, the tabs share the list's width equally.
  /**
   * Fixed tabs display all tabs in a set simultaneously. They are best for switching
   * between related content quickly, such as between transportation methods in a map.
   *
   * When a set of tabs cannot fit on screen, use scrollable tabs. Scrollable tabs can use
   * longer text labels and a larger number of tabs. They are best used for browsing on
   * touch interfaces.
   *
   * When using scrollable tabs, the first visible tab should be offset by 52dp from the
   * left side of the device for both web and mobile. The width of each tab is defined by
   * the length of its text label.
   *
   * @default false
   * @see https://m3.material.io/components/tabs/guidelines
   * @see https://m3.material.io/components/tabs/accessibility
   */
  isScrollable?: boolean
}

// The props of React Aria's TabList, which `TabList` is built on, with the `ref` of the `<div>`
// it renders, and the M3 prop; `children` are its tabs, or a function of its `items`.
export type TabListProps<T extends object = object> = AriaTabListProps<T> &
  RefProps<HTMLDivElement> &
  TabListBaseProps

// Every prop, `className` (a string, or a function of the state React Aria reports) and
// the ref included, is the list's own, the `tablist`.
/**
 * The container holds multiple tabs. Its contents can be fixed or scrollable.
 *
 * The container should always extend the full width of the window and be divided into
 * equal sections, one for each tab.
 *
 * The container is defined by a divider on the bottom edge to separate it from the
 * content below. Content may scroll under the container.
 *
 * Tabs are displayed in a single row, with each tab connected to the content it
 * represents. As a set, all tabs are unified by a shared topic.
 *
 * @see https://m3.material.io/components/tabs/guidelines
 */
export function TabList<T extends object>({
  isScrollable = false,
  className,
  ...props
}: TabListProps<T>) {
  const { orientation } = useContext(TabsContext)
  return (
    <AriaTabList
      {...props}
      className={composeTailwindRenderProps(
        className,
        list({ orientation, scrollable: isScrollable }),
      )}
    />
  )
}
