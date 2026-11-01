import { createContext, useContext } from 'react'

/* What a NavigationRail tells what is in it: whether it is laid out as an expanded rail, for
 * where an item puts its label and whether a section shows, and a section its items that they
 * are secondary, only ever seen expanded. Context, not props, so wrappers in between still work. */
export type NavigationRailContextValue = { expanded: boolean; secondary?: boolean }

export const NavigationRailContext = createContext<NavigationRailContextValue | undefined>(
  undefined,
)

/** The NavigationRail an item or a section is in, or nothing outside one. */
export const useNavigationRail = () => useContext(NavigationRailContext)
