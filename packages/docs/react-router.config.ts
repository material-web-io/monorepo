import type { Config } from '@react-router/dev/config'

// A static site: no server at run time, every route rendered to an HTML file by the build.
// DOCS_BASE is the path the site is served under, for a host that serves it below its root.
export default {
  appDirectory: 'src',
  basename: process.env.DOCS_BASE ?? '/',
  buildDirectory: 'dist',
  ssr: false,
  // Every page of the site map: the route that catches any other path has none to render.
  prerender: ({ getStaticPaths }) => getStaticPaths(),
} satisfies Config
