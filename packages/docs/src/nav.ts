import { version } from '../../react/package.json'
import type { LogoName } from './components/logos'

/** A page of the site: `src/content<path>.mdx`. */
export type Page = {
  path: string
  title: string
  description: string
  /** The Material Design page a page is built from. */
  spec?: string
  /** The Tailwind CSS page of what a page builds on. */
  tailwind?: string
  /** The React Aria page of what a page builds on. */
  reactAria?: string
  /** The folder of its source, under `packages/`. */
  source?: string
}

/** A part of a section's own page: some of the section's pages under a title. */
export type Group = {
  title: string
  /** The paths of its pages. Without them, it has every page no other part has. */
  paths?: string[]
}

/** A group of pages, with a page of its own that lists them. */
export type Section = Page & {
  /** The Material Symbol of its destination in the navigation. */
  icon: string
  pages: Page[]
  /** The parts its own page lists its pages in. Without them, it lists them all at once. */
  groups?: Group[]
}

export const site = {
  title: 'Material 3 for React & Tailwind',
  shortTitle: 'Material 3',
  description: 'Two libraries that bring Material Design 3 to React and Tailwind CSS.',
  repository: 'https://github.com/material-web-io/monorepo',
  /** The version of both libraries, which are released together. */
  version,
}

export const home: Page & { icon: string } = {
  path: '/',
  title: 'Home',
  description: site.description,
  icon: 'home',
}

// A component's page, with the pages of what it is built on and of what its text mentions.
const component = (
  name: string,
  title: string,
  description: string,
  {
    spec = `components/${name}`,
    tailwind,
    reactAria,
  }: { spec?: string; tailwind?: string; reactAria?: string } = {},
): Page => ({
  path: `/components/${name}`,
  title,
  description,
  spec: `https://m3.material.io/${spec}`,
  ...(tailwind && { tailwind: `https://tailwindcss.com/docs/${tailwind}` }),
  ...(reactAria && { reactAria: `https://react-aria.adobe.com/${reactAria}` }),
  source: `react/src/components/${name}`,
})

// A page of the theme, with the pages of the libraries its text mentions.
const token = (
  name: string,
  title: string,
  description: string,
  { spec, tailwind, reactAria }: { spec: string; tailwind: string; reactAria?: string },
): Page => ({
  path: `/theme/${name}`,
  title,
  description,
  spec: `https://m3.material.io/${spec}`,
  tailwind: `https://tailwindcss.com/docs/${tailwind}`,
  ...(reactAria && { reactAria: `https://react-aria.adobe.com/${reactAria}` }),
  source: `tailwind/src/${name}.css`,
})

export const sections: Section[] = [
  {
    path: '/get-started',
    title: 'Get started',
    description: 'Install the libraries, learn the core concepts and build with Material 3.',
    icon: 'rocket_launch',
    pages: [
      {
        path: '/get-started/installation',
        title: 'Installation',
        description: 'Install the React components, or the Tailwind theme on its own.',
      },
      {
        path: '/get-started/react-aria',
        title: 'React Aria',
        description: 'Use React Aria props, parts and providers with the components.',
      },
      {
        path: '/get-started/styling',
        title: 'Styling',
        description: 'Customize components with Tailwind classes.',
      },
      {
        path: '/get-started/composition',
        title: 'Composition',
        description: 'Build interfaces by composing components and slots.',
      },
    ],
  },
  {
    path: '/theme',
    title: 'Theme',
    description: 'The Material 3 design tokens as a theme for Tailwind CSS.',
    spec: 'https://m3.material.io/foundations/design-tokens/overview',
    tailwind: 'https://tailwindcss.com/docs/theme',
    icon: 'palette',
    pages: [
      {
        path: '/theme/color',
        title: 'Color',
        description: 'Color roles and schemes, and how to customize the theme.',
        spec: 'https://m3.material.io/styles/color/roles',
        tailwind: 'https://tailwindcss.com/docs/colors',
        source: 'tailwind/src/theme-default.css',
      },
      token('typography', 'Typography', 'The type scale, typefaces and font weights.', {
        spec: 'styles/typography/type-scale-tokens',
        tailwind: 'font-size',
      }),
      token('shape', 'Shape', 'The corner radius scale and the shape library.', {
        spec: 'styles/shape/corner-radius-scale',
        tailwind: 'border-radius',
      }),
      token('spacing', 'Spacing', 'The spacing scale and density.', {
        spec: 'styles/spacing/overview',
        tailwind: 'theme#theme-variable-namespaces',
      }),
      token('elevation', 'Elevation', 'Elevation levels and shadows.', {
        spec: 'styles/elevation/tokens',
        tailwind: 'box-shadow',
      }),
      token('motion', 'Motion', 'Easing, duration, springs and transitions.', {
        spec: 'styles/motion/overview/how-it-works',
        tailwind: 'transition-property',
      }),
      token('state', 'State', 'State layers, focus rings and state variants.', {
        spec: 'foundations/interaction/states/state-layers',
        tailwind: 'hover-focus-and-other-states',
        reactAria: 'styling',
      }),
      token('layout', 'Layout', 'Breakpoints, stacking order and scrollbars.', {
        spec: 'foundations/layout/breakpoints/overview',
        tailwind: 'responsive-design',
      }),
      token(
        'accessibility',
        'Accessibility',
        'Touch targets, forced colors, contrast and reduced motion.',
        {
          spec: 'foundations/designing/structure',
          tailwind: 'hover-focus-and-other-states#media-and-feature-queries',
          reactAria: 'styling',
        },
      ),
    ],
  },
  {
    path: '/components',
    title: 'Components',
    description: 'Accessible React components that follow the Material 3 specification.',
    icon: 'widgets',
    // The parts of Material's own Components page: the kinds with several components, then
    // every other component.
    groups: [
      {
        title: 'Buttons',
        paths: [
          '/components/button',
          '/components/button-group',
          '/components/fab',
          '/components/fab-menu',
          '/components/icon-button',
          '/components/split-button',
        ],
      },
      {
        title: 'Date & time pickers',
        paths: [
          '/components/calendar',
          '/components/date-field',
          '/components/date-picker',
          '/components/time-picker',
        ],
      },
      {
        title: 'Loading & progress',
        paths: ['/components/loading-indicator', '/components/progress-indicator'],
      },
      {
        title: 'Navigation',
        paths: ['/components/navigation-bar', '/components/navigation-rail'],
      },
      {
        title: 'Sheets',
        paths: ['/components/bottom-sheet', '/components/side-sheet'],
      },
      { title: 'All other components' },
    ],
    pages: [
      component(
        'app-bar',
        'App bar',
        'App bars are placed at the top of the screen to help people navigate through a product.',
        { spec: 'components/app-bars' },
      ),
      component(
        'bottom-sheet',
        'Bottom sheet',
        'Bottom sheets show secondary content anchored to the bottom of the screen.',
        {
          spec: 'components/bottom-sheets',
          tailwind: 'theme#theme-variable-namespaces',
          reactAria: 'Sheet',
        },
      ),
      component('button', 'Button', 'Buttons prompt most actions in a UI.', {
        spec: 'components/buttons',
        reactAria: 'Button',
      }),
      component(
        'button-group',
        'Button group',
        'Button groups organize buttons and add interactions between them.',
        { spec: 'components/button-groups', reactAria: 'ToggleButtonGroup' },
      ),
      component(
        'calendar',
        'Calendar',
        'Calendars show a month of days for selecting a date or a range of dates.',
        { spec: 'components/date-pickers', reactAria: 'Calendar' },
      ),
      component('card', 'Card', 'Cards display content and actions about a single subject.', {
        spec: 'components/cards',
      }),
      component(
        'checkbox',
        'Checkbox',
        'Checkboxes let users select one or more items from a list, or turn an item on or off.',
        { reactAria: 'Checkbox' },
      ),
      component(
        'chip',
        'Chip',
        'Chips help people enter information, make selections, filter content, or trigger actions.',
        { spec: 'components/chips', reactAria: 'TagGroup' },
      ),
      component(
        'date-field',
        'Date field',
        'Date fields let people enter a date with the keyboard.',
        { spec: 'components/date-pickers', reactAria: 'DateField' },
      ),
      component(
        'date-picker',
        'Date picker',
        'Date pickers let people select a date, or a range of dates.',
        { spec: 'components/date-pickers', reactAria: 'Calendar' },
      ),
      component('dialog', 'Dialog', 'Dialogs provide important prompts in a user flow.', {
        spec: 'components/dialogs',
        reactAria: 'Modal',
      }),
      component(
        'divider',
        'Divider',
        'Dividers are thin lines that group content in lists or other containers.',
        { reactAria: 'Separator' },
      ),
      component('fab', 'FAB', 'Floating action buttons (FABs) help people take primary actions.', {
        spec: 'components/floating-action-button',
        reactAria: 'Button',
      }),
      component(
        'fab-menu',
        'FAB menu',
        'FAB menus open from a FAB to display multiple related actions.',
        { reactAria: 'Menu' },
      ),
      component('icon', 'Icon', 'Icons display Material Symbols.', { spec: 'styles/icons' }),
      component(
        'icon-button',
        'Icon button',
        'Icon buttons help people take actions with a single tap.',
        { spec: 'components/icon-buttons', reactAria: 'Button' },
      ),
      component('list', 'List', 'Lists are continuous, vertical indexes of text and images.', {
        spec: 'components/lists',
        reactAria: 'GridList',
      }),
      component(
        'loading-indicator',
        'Loading indicator',
        'Loading indicators show the progress of a process for a short wait time.',
        { reactAria: 'ProgressBar' },
      ),
      component('menu', 'Menu', 'Menus display a list of choices on a temporary surface.', {
        spec: 'components/menus',
        reactAria: 'Menu',
      }),
      component(
        'navigation-bar',
        'Navigation bar',
        'Navigation bars let people switch between UI views on smaller devices.',
        { reactAria: 'Toolbar' },
      ),
      component(
        'navigation-rail',
        'Navigation rail',
        'Navigation rails let people switch between UI views on mid-sized devices.',
        { reactAria: 'Toolbar' },
      ),
      component(
        'progress-indicator',
        'Progress indicator',
        'Progress indicators show the status of a process in real time.',
        { spec: 'components/progress-indicators', reactAria: 'ProgressBar' },
      ),
      component(
        'radio',
        'Radio button',
        'Radio buttons let people select one option from a set of options.',
        { spec: 'components/radio-button', reactAria: 'RadioGroup' },
      ),
      component(
        'ripple',
        'Ripple',
        'Ripples add state layers and press feedback to interactive elements.',
        { spec: 'foundations/interaction/states/state-layers', reactAria: 'styling' },
      ),
      component(
        'search',
        'Search',
        'Search lets people enter a keyword or phrase to get relevant information.',
        { reactAria: 'SearchField' },
      ),
      component(
        'side-sheet',
        'Side sheet',
        'Side sheets show secondary content anchored to the side of the screen.',
        {
          spec: 'components/side-sheets',
          tailwind: 'theme#theme-variable-namespaces',
          reactAria: 'Sheet',
        },
      ),
      component(
        'slider',
        'Slider',
        'Sliders allow users to make selections from a range of values.',
        { spec: 'components/sliders', reactAria: 'Slider' },
      ),
      component(
        'snackbar',
        'Snackbar',
        'Snackbars show short updates about app processes at the bottom of the screen.',
        { reactAria: 'Toast' },
      ),
      component(
        'split-button',
        'Split button',
        'Split buttons open a menu to give people more options related to an action.',
        { reactAria: 'Button' },
      ),
      component('switch', 'Switch', 'Switches toggle the selection of an item on and off.', {
        reactAria: 'Switch',
      }),
      component('tabs', 'Tabs', 'Tabs organize content across different screens and views.', {
        reactAria: 'Tabs',
      }),
      component('text-field', 'Text field', 'Text fields let users enter text into a UI.', {
        spec: 'components/text-fields',
        reactAria: 'TextField',
      }),
      component(
        'time-picker',
        'Time picker',
        'Time pickers help people select and set a specific time.',
        { spec: 'components/time-pickers', reactAria: 'TimeField' },
      ),
      component(
        'toolbar',
        'Toolbar',
        'Toolbars display frequently used actions relevant to the current page.',
        { spec: 'components/toolbars', reactAria: 'Toolbar' },
      ),
      component('tooltip', 'Tooltip', 'Tooltips display brief labels or messages.', {
        spec: 'components/tooltips',
        reactAria: 'Tooltip',
      }),
    ],
  },
]

/**
 * A link in a page's header to a page of what it is built on, with a Material Symbol, or the
 * logo of what it links to.
 */
export type Reference = { title: string; href: string } & ({ icon: string } | { logo: LogoName })

/** The references of a page, in the order its header has them. */
export const referencesOf = ({ spec, tailwind, reactAria, source }: Page): Reference[] => [
  ...(spec ? [{ title: 'Material Design', logo: 'material-design' as const, href: spec }] : []),
  ...(tailwind ? [{ title: 'Tailwind CSS', logo: 'tailwind' as const, href: tailwind }] : []),
  ...(reactAria ? [{ title: 'React Aria', logo: 'react-aria' as const, href: reactAria }] : []),
  ...(source
    ? [{ title: 'Source', icon: 'code', href: `${site.repository}/tree/main/packages/${source}` }]
    : []),
]

/** An entry of a section's list in the navigation: a page, or some of its pages under a title. */
export type Entry = Page | { title: string; pages: Page[] }

/**
 * A section's pages as the navigation lists them: each of its parts that names its pages is
 * one entry, among the pages no part names, in the order of their titles as Material's own
 * list is. A section with no such part lists its pages as they are written.
 */
export const entriesOf = ({ pages, groups = [] }: Section): Entry[] => {
  const parts = groups.flatMap(({ title, paths }) =>
    paths ? [{ title, pages: pages.filter((page) => paths.includes(page.path)) }] : [],
  )
  if (!parts.length) return pages
  const named = new Set(parts.flatMap((part) => part.pages))
  // English order whatever the reader's language, so the built page and the browser agree.
  return [...pages.filter((page) => !named.has(page)), ...parts].sort((a, b) =>
    a.title.localeCompare(b.title, 'en'),
  )
}

/**
 * A section's pages as its own page lists them: in its parts, each with the pages it names, and
 * the pages no part names in the one that names none. A section with no parts lists its pages
 * in one, which has no title.
 */
export const partsOf = ({ pages, groups }: Section) => {
  const parts: Partial<Group>[] = groups ?? [{}]
  const named = new Set(parts.flatMap((part) => part.paths ?? []))
  return parts.map(({ title, paths }) => ({
    title,
    pages: pages.filter((page) => (paths ? paths.includes(page.path) : !named.has(page.path))),
  }))
}

/** Every page in the order the site reads in, a section before its pages. */
export const pages: Page[] = [home, ...sections.flatMap((section) => [section, ...section.pages])]

/** The section a path is in, its own page included. */
export const sectionOf = (path: string) =>
  sections.find((section) => path === section.path || path.startsWith(`${section.path}/`))

/** A path as the site map writes it: with no slash at its end, but for the home page's. */
export const normalize = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

/** The page at a path, if the site has one there. */
export const pageAt = (path: string) => pages.find((page) => page.path === normalize(path))
