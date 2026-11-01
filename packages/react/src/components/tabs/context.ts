import { createContext } from 'react'
import type { Orientation } from 'react-aria'

export type TabsVariant = 'primary' | 'secondary'

/* What Tabs tells its parts: its variant and orientation, and `setIndicator`, which keeps the
 * indicator of the tab just selected and returns the one shown before it, to slide from. Context,
 * not props, so wrappers in between still work. */
export type TabsContextValue = {
  variant: TabsVariant
  orientation: Orientation
  setIndicator: (indicator: HTMLElement) => HTMLElement | null
}

// Outside a Tabs, a tab is primary, in a row, and has no indicator before its own to slide from.
export const TabsContext = createContext<TabsContextValue>({
  variant: 'primary',
  orientation: 'horizontal',
  setIndicator: () => null,
})
