import { useMemo } from 'react'
import { Group, type GroupProps, type GroupRenderProps } from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { tv } from '../../lib/tv'
import { NavigationRailContext, useNavigationRail } from './context'

/* A group of secondary destinations, which only an expanded rail shows: clear and out of
 * reach in a collapsed one, where it keeps its room under the rail's items, 14dp nearer them,
 * its icons as far from the last of theirs as in the expanded rail (navigation-rail.css). */
const section = tv({
  base: 'navigation-rail-list',
  variants: {
    shown: {
      true: 'transition-navigation-rail-section-in',
      false: 'invisible opacity-0 transition-navigation-rail-section-out',
    },
    // Outside a rail there are no items of one over it to keep its place under.
    placed: { true: 'navigation-rail-section navigation-rail-moments', false: '' },
  },
})

// What React Aria's Group reports of a section, which its class and children are given.
export type NavigationRailSectionRenderProps = GroupRenderProps

// React Aria's Group's props, which the section is, with the `ref` of its `<div>`. An
// `aria-label` names it, or an `aria-labelledby` pointing at its section header.
export type NavigationRailSectionProps = GroupProps & RefProps<HTMLDivElement>

// A child of a `NavigationRail`, written after its items, under which it is drawn. Its children
// are drawn as written: `NavigationRailItem`s, after the section header of the specs'
// measurements, if any, React Aria's `Text` in the `header` slot. Outside a rail, or in one that
// hides when collapsed, it always shows.
/**
 * An expanded rail can reveal secondary destinations not visible when collapsed.
 *
 * Extra destinations can be shown in an expanded nav rail.
 *
 * Use a standard expanded rail when there are secondary destinations or actions that have
 * lower priority than the main navigation items
 *
 * @see https://m3.material.io/components/navigation-rail/guidelines
 */
export function NavigationRailSection({ className, ...props }: NavigationRailSectionProps) {
  const rail = useNavigationRail()
  const shown = rail?.expanded ?? true
  const value = useMemo(() => ({ expanded: shown, secondary: true }), [shown])
  return (
    <NavigationRailContext.Provider value={value}>
      <Group
        {...props}
        className={composeTailwindRenderProps(
          className,
          section({ shown, placed: rail !== undefined }),
        )}
      />
    </NavigationRailContext.Provider>
  )
}
