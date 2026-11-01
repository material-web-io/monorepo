import type { Picture } from '../components/hero'
import { components } from './components'
import { getStarted } from './get-started'
import { site } from './site'
import { theme } from './theme'

/**
 * The picture in each page's header, and on its card where it has no other, by the page's
 * path: shapes that stand for what the page is about. The Get started section's own page draws
 * its header's pictures itself (routes/get-started.tsx), so its picture here is its card's.
 */
export const art: Record<string, Picture> = { ...site, ...getStarted, ...theme, ...components }
