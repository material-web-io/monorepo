import { createContext } from 'react'

export type FabMenuColor = 'primary' | 'secondary' | 'tertiary'

export type FabMenuSize = 'baseline' | 'medium' | 'large'

/* The color set a FabMenu was given, for the items in it. Whether it is open, and the rest of
 * what they need, each reads from React Aria. */
export const FabMenuContext = createContext<{ color: FabMenuColor }>({ color: 'primary' })
