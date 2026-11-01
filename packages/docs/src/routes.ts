import { index, layout, route, type RouteConfig } from '@react-router/dev/routes'
import { sections } from './nav'

// The sections whose own page is written for them: the others list their pages.
const own: Record<string, string> = { '/get-started': './routes/get-started.tsx' }

// The site map's pages, each the MDX file at its path under content/, in the site's shell.
export default [
  layout('./components/shell.tsx', [
    index('./routes/home.tsx'),
    ...sections.flatMap((section) => [
      route(section.path, own[section.path] ?? './routes/section.tsx', { id: section.path }),
      ...section.pages.map((page) => route(page.path, `./content${page.path}.mdx`)),
    ]),
    route('*', './routes/not-found.tsx'),
  ]),
] satisfies RouteConfig
