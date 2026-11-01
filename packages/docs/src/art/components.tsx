import type { Picture } from '../components/hero'
import { partsOf, sections } from '../nav'

// The grounds of the components' pictures (styles.css), one for each component in turn.
const grounds = [
  'docs-gradient-blush',
  'docs-gradient-ember',
  'docs-gradient-dawn',
  'docs-gradient-dusk',
  'docs-gradient-glow',
]

/**
 * The pictures of the component pages: a gradient behind the device that shows the component
 * in use (scenes/), the same one its card's picture is on. A page's place on the Components
 * page picks its gradient, so that cards and pages next to each other differ.
 */
export const components: Record<string, Picture> = Object.fromEntries(
  sections
    .filter((section) => section.path === '/components')
    .flatMap(partsOf)
    .flatMap((part) => part.pages)
    .map(({ path }, index) => [path, { ground: grounds[index % grounds.length]!, shapes: null }]),
)
