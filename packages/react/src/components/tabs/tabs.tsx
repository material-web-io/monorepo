import { useCallback, useMemo, useRef } from 'react'
import { Tabs as AriaTabs, type TabsProps as AriaTabsProps } from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { TabsContext, type TabsVariant } from './context'

// Horizontal, the tabs are over their panels; vertical, beside them (tab-list.tsx, tab-panel.tsx).
const tabs = tv({
  variants: { orientation: { horizontal: '', vertical: 'flex' } },
})

export type { TabsRenderProps } from 'react-aria-components'

// The props `Tabs` adds to those of React Aria's Tabs. The comments on them quote the
// M3 tabs pages, which each comment lists under @see; they add no wording of our own.
type TabsBaseProps = {
  /**
   * Two variants: primary and secondary
   *
   * - `primary`: Primary tabs are placed at the top of the content pane under an app
   *   bar. They display the main content destinations.
   *   Primary tabs should be used when just one set of tabs are needed.
   * - `secondary`: Secondary tabs are used within a content area to further separate
   *   related content and establish hierarchy.
   *   Secondary tabs are necessary when a screen requires more than one level of tabs.
   *   These tabs use a simpler style of indicator, but their function is identical to
   *   primary tabs.
   *   Secondary tabs should always be placed below primary tabs.
   *
   * @default 'primary'
   * @see https://m3.material.io/components/tabs/overview
   * @see https://m3.material.io/components/tabs/guidelines
   */
  variant?: TabsVariant
}

// React Aria's Tabs props, with the `ref` of the `<div>` it renders, and the M3 `variant`.
// `keyboardActivation` is `manual` unless set: the arrow keys move the focus and Space or Enter
// selects. A `vertical` orientation puts the tabs in a column beside their panels.
export type TabsProps = AriaTabsProps & RefProps<HTMLDivElement> & TabsBaseProps

// Composed as React Aria's Tabs are: the row of tabs is the `TabList`, each tab a `Tab`, and
// what they show a `TabPanel` per tab, each with the `id` of its tab.
/**
 * Tabs organize content across different screens and views
 *
 * Tabs organize groups of related content that are at the same level of hierarchy.
 *
 * Use tabs to group related content, not sequential content.
 *
 * Avoid using more than four tabs at once. At five or more tabs, the container becomes
 * cramped.
 *
 * Keyboard navigation:
 * - Arrow: Focus lands on the next available navigation destination
 * - Space / Enter: Activates the focused navigation destination
 *
 * Don't apply density to tabs by default — this lowers their targets below our best
 * practice of 48x48 CSS pixels.
 *
 * @see https://m3.material.io/components/tabs/overview
 * @see https://m3.material.io/components/tabs/guidelines
 * @see https://m3.material.io/components/tabs/accessibility
 */
export function Tabs({
  variant = 'primary',
  keyboardActivation = 'manual',
  orientation = 'horizontal',
  className,
  ...props
}: TabsProps) {
  // The indicator of the tab selected last, for the next one to slide in from.
  const indicatorRef = useRef<HTMLElement | null>(null)
  const setIndicator = useCallback((indicator: HTMLElement) => {
    const from = indicatorRef.current
    indicatorRef.current = indicator
    return from
  }, [])
  const value = useMemo(
    () => ({ variant, orientation, setIndicator }),
    [variant, orientation, setIndicator],
  )
  return (
    <TabsContext.Provider value={value}>
      <AriaTabs
        keyboardActivation={keyboardActivation}
        orientation={orientation}
        {...props}
        className={composeTailwindRenderProps(className, tabs({ orientation }))}
      />
    </TabsContext.Provider>
  )
}
