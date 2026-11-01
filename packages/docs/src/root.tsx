// Roboto in the type scale's three weights, loaded as the installation page has a reader do.
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fontsource-variable/roboto-mono/wght.css'
// The icon font, in the build only the icons named in the source (plugins/icon-font.ts).
import symbols from 'virtual:icon-font?url'
import type { ReactNode } from 'react'
import { I18nProvider, RouterProvider } from 'react-aria-components'
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useHref } from 'react-router'
import { Snackbars } from './components/snackbars'
import { useSiteNavigate } from './leaving'
import { settingsScript } from './settings'
import './styles.css'

/* The icon font, as Fontsource declares it but for `font-display`: an icon is the name of its
 * glyph until the font is there, so the name is not drawn in the meantime, and the font is
 * fetched with the page. */
const symbolsFace = `@font-face {
  font-family: 'Material Symbols Outlined Variable';
  font-style: normal;
  font-display: block;
  font-weight: 100 700;
  src: url(${symbols}) format('woff2-variations');
}`

// The stored theme is set on <html> before React starts, which the built page does not have.
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <link rel="icon" type="image/svg+xml" href={`${import.meta.env.BASE_URL}favicon.svg`} />
        <link rel="preload" href={symbols} as="font" type="font/woff2" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{ __html: symbolsFace }} />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: settingsScript }} />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

// The router's `useHref` puts the site's base path before a path of the site, and would before
// a link to another site too: an address with a scheme is left as it is.
function useSiteHref(href: string) {
  const resolved = useHref(href)
  return /^[a-z][a-z\d+.-]*:/i.test(href) ? href : resolved
}

/* React Aria's links follow the site's router, and its locale is the one the pages are written
 * in, so that the built page and the browser format a date alike. */
export default function Root() {
  const navigate = useSiteNavigate()
  return (
    <I18nProvider locale="en-US">
      <RouterProvider navigate={navigate} useHref={useSiteHref}>
        <Outlet />
        <Snackbars />
      </RouterProvider>
    </I18nProvider>
  )
}
