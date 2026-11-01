import { useContext } from 'react'
import {
  TabPanel as AriaTabPanel,
  type TabPanelProps as AriaTabPanelProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { TabsContext } from './context'

/* A panel is a tab stop after its tab, when nothing in it is, so that the keyboard can reach
 * what it shows: it draws the focus ring on the focus React Aria reports. Beside vertical tabs,
 * it takes the rest of the width. */
const panel = tv({
  base: 'focus-ring outline-none',
  variants: { orientation: { horizontal: '', vertical: 'min-w-0 flex-1' } },
})

export type { TabPanelRenderProps } from 'react-aria-components'

// The props of React Aria's TabPanel, which `TabPanel` is built on, with the `ref` of the
// `<div>` it renders: its `id`, its tab's, and `shouldForceMount`; `children` are what the
// panel shows, as they are or as its render prop returns them.
export type TabPanelProps = AriaTabPanelProps & RefProps<HTMLDivElement>

// React Aria's TabPanel, the `tabpanel` named by the tab with its `id`, shown while that tab is
// selected (or kept in the DOM with `shouldForceMount`, as React Aria has it).
/**
 * Tabs are displayed in a single row, with each tab connected to the content it
 * represents.
 *
 * @see https://m3.material.io/components/tabs/guidelines
 */
export function TabPanel({ className, ...props }: TabPanelProps) {
  const { orientation } = useContext(TabsContext)
  return (
    <AriaTabPanel
      {...props}
      className={composeTailwindRenderProps(className, panel({ orientation }))}
    />
  )
}
