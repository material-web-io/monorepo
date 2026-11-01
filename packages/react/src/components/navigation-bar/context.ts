import { createContext } from 'react'

export type NavigationBarLayout = 'vertical' | 'horizontal'

export type NavigationBarArrangement = 'equal-weight' | 'centered'

/* What a NavigationBar tells the items in it: how they are laid out, for where an item puts its
 * label and how wide its indicator is, and how they are arranged, for how wide an item is.
 * Outside a bar, an item is vertical and of equal weight. */
export type NavigationBarContextValue = {
  layout: NavigationBarLayout
  arrangement: NavigationBarArrangement
}

export const NavigationBarContext = createContext<NavigationBarContextValue>({
  layout: 'vertical',
  arrangement: 'equal-weight',
})
