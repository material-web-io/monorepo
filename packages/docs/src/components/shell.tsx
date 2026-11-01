import { Icon, twMerge } from '@material-web/react'
import { MDXProvider } from '@mdx-js/react'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from 'react'
import { Link, Tab, TabList, Tabs } from 'react-aria-components'
import { Outlet, useHref, useLocation, useMatches } from 'react-router'
import type { PageHandle, PageTab } from '../../plugins/remark-handle'
import { art } from '../art'
import { arrive, leave, useLeaving } from '../leaving'
import { home, normalize, pageAt, pages, referencesOf, sectionOf, site, type Page } from '../nav'
import { subscribeToScroll, useLastScrolledPast } from '../scroll'
import { Hero } from './hero'
import { mdxComponents, TabTurn } from './mdx'
import { Rail, TopBar } from './rail'
import { Version } from './release'
import { SiteSearch } from './site-search'

const tabs: Record<PageTab, { label: string; icon: string }> = {
  overview: { label: 'Overview', icon: 'info' },
  accessibility: { label: 'Accessibility', icon: 'accessibility_new' },
  props: { label: 'Props', icon: 'data_object' },
}

/** The picture of each component in its page's header, by the page's path (scenes/). */
const scenes = Object.fromEntries(
  Object.entries(
    import.meta.glob<ComponentType>('../scenes/*.tsx', { eager: true, import: 'default' }),
  ).map(([file, scene]) => [`/components/${file.replace(/^.*\/|\.tsx$/g, '')}`, scene]),
)

const subscribeToNothing = () => () => {}

// The headings of the part of the page shown, the one the page is at marked: the last one
// scrolled to the top of the window, under the tabs.
function Contents({
  title,
  headings,
  className,
}: {
  title: string
  headings: PageHandle['headings']
  className?: string
}) {
  const inView = useLastScrolledPast(
    headings.map((heading) => heading.id),
    () => 160,
  )
  return (
    <nav aria-label="On this page" className={twMerge('docs-contents', className)}>
      <p className="docs-contents-label">On this page</p>
      <p className="docs-contents-title">{title}</p>
      {headings.map(({ id, text, depth }) => (
        <Link
          key={id}
          href={`#${id}`}
          className={twMerge(
            'docs-contents-link',
            depth === 3 ? 'ps-space-300' : '',
            id === inView ? 'docs-contents-link-current' : '',
          )}
        >
          {text}
        </Link>
      ))}
    </nav>
  )
}

// The pages before and after this one, in the order the site reads in.
function PageTurn({ page }: { page: Page }) {
  const index = pages.indexOf(page)
  const previous = pages[index - 1]
  const next = pages[index + 1]
  return (
    <nav aria-label="Pages" className="docs-page-turn">
      {previous && (
        <Link href={previous.path} className="docs-page-turn-link">
          <Icon name="arrow_back" className="rtl:icon-mirrored" />
          <span className="docs-page-turn-label">Previous</span>
          {previous.title}
        </Link>
      )}
      {next && (
        <Link href={next.path} className="docs-page-turn-link col-start-2 items-end text-end">
          <Icon name="arrow_forward" className="rtl:icon-mirrored" />
          <span className="docs-page-turn-label">Next</span>
          {next.title}
        </Link>
      )}
    </nav>
  )
}

/**
 * A page written in MDX: its header, with the picture of the component it is about, its tabs
 * when it is cut into them, and its text, beside the list of its headings.
 */
function WrittenPage({ page, handle }: { page: Page; handle: PageHandle }) {
  const { hash } = useLocation()
  const section = sectionOf(page.path)
  const target = decodeURIComponent(hash.slice(1))
  // The built page has no address to read a heading from, and the browser's first draw is its.
  const isLive = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  )
  const addressed = handle.tabs.includes(target as PageTab)
    ? (target as PageTab)
    : handle.headings.find((heading) => heading.id === target)?.tab
  // The tab picked by hand holds until the address names another heading.
  const [picked, setPicked] = useState<{ tab: PageTab; hash: string }>()
  const tab =
    (picked?.hash === hash ? picked.tab : undefined) ??
    (isLive ? addressed : undefined) ??
    'overview'
  // The side the tab shown comes in from (TabTurn), once the reader turns from tab to tab: the
  // tab the address names as the page goes live is the one it opened on, not one turned to.
  const [turn, setTurn] = useState<{ tab: PageTab; isLive: boolean; from?: 'start' | 'end' }>({
    tab,
    isLive,
  })
  if (turn.tab !== tab || turn.isLive !== isLive) {
    const isAfter = handle.tabs.indexOf(tab) > handle.tabs.indexOf(turn.tab)
    const from = isAfter ? 'end' : 'start'
    setTurn({ tab, isLive, from: turn.isLive && turn.tab !== tab ? from : turn.from })
  }
  const top = useRef<HTMLDivElement>(null)
  // The tabs are stuck at the window's top once the page has scrolled past where they stand.
  const isStuck = useSyncExternalStore(
    subscribeToScroll,
    () => (top.current?.getBoundingClientRect().top ?? 1) < 1,
    () => false,
  )
  // A heading in a tab that was hidden is one the browser could not scroll to.
  useEffect(() => {
    if (!isLive || !target) return
    const heading = document.getElementById(target) ?? top.current
    heading?.scrollIntoView()
  }, [isLive, target])

  const headings = handle.headings.filter((heading) => heading.tab === tab)
  const Scene = scenes[page.path]
  // A tab's contents are drawn anew for it, to fade in where they stand once the reader turns.
  const body = (
    <div className="docs-page">
      {headings.length > 0 && (
        <Contents
          key={tab}
          title={page.title}
          headings={headings}
          className={turn.from && 'docs-enter-in-place'}
        />
      )}
      <article className="docs-article">
        <MDXProvider components={mdxComponents}>
          <TabTurn value={turn.from}>
            <Outlet />
          </TabTurn>
        </MDXProvider>
        <PageTurn page={page} />
      </article>
    </div>
  )
  return (
    <>
      <Hero
        title={page.title}
        description={page.description}
        art={art[page.path]}
        overline={
          section && (
            <Link href={section.path} className="docs-hero-overline">
              {section.title}
            </Link>
          )
        }
        references={referencesOf(page)}
      >
        {Scene && (
          // A picture of the component, not one to use.
          <div inert className="docs-scene">
            <Scene />
          </div>
        )}
      </Hero>
      {handle.tabs.length > 0 ? (
        <Tabs
          selectedKey={tab}
          onSelectionChange={(key) => {
            setPicked({ tab: key as PageTab, hash })
            // A tab picked from far down the page starts at its top.
            if ((top.current?.getBoundingClientRect().top ?? 0) < 0) top.current?.scrollIntoView()
          }}
        >
          <div ref={top} />
          <div className={twMerge('docs-tab-bar', isStuck ? 'docs-tab-bar-stuck' : '')}>
            <TabList
              aria-label={page.title}
              className={twMerge('docs-tab-list', isStuck ? 'docs-tab-list-stuck' : '')}
            >
              {handle.tabs.map((id) => (
                <Tab key={id} id={id} className="docs-tab">
                  <Icon name={tabs[id].icon} className="icon-24" />
                  {tabs[id].label}
                </Tab>
              ))}
            </TabList>
          </div>
          {body}
        </Tabs>
      ) : (
        body
      )}
    </>
  )
}

/**
 * The page shown and its footer, drawn anew for each path so that each comes in (docs-enter).
 * A press that leaves it hides it at once (leaving.ts), and the next comes in once the hold has
 * run from that press, or as soon as it is there when that takes longer.
 */
function ShownPage({
  width,
  isHidden,
  children,
}: {
  width: string
  isHidden: boolean
  children: ReactNode
}) {
  const { pathname, key } = useLocation()
  const main = useRef<HTMLElement>(null)
  const footer = useRef<HTMLElement>(null)
  // Of the hold, what is left once the page is there, if anything.
  useLayoutEffect(() => {
    const left = arrive()
    if (!left) return
    const waited = performance.now() - left.at
    for (const part of [main.current, footer.current])
      for (const animation of part?.getAnimations() ?? []) {
        const delay = animation.effect?.getTiming().delay ?? 0
        animation.effect?.updateTiming({ delay: Math.max(0, delay - waited) })
      }
  }, [])
  // Back or forward to another page leaves this one as a press does; back to this one, as
  // from a press whose page has yet to load, stays.
  const base = useHref('/').replace(/\/$/, '')
  useEffect(() => {
    const onPopState = () => {
      const path = normalize(window.location.pathname.slice(base.length) || '/')
      if (path !== normalize(pathname)) leave({ key, path, isPushed: false })
      else leave()
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [base, pathname, key])
  const hidden = isHidden ? 'invisible' : ''
  return (
    <>
      <main
        ref={main}
        id="main-content"
        tabIndex={-1}
        className={twMerge('docs-main', width, hidden)}
      >
        {children}
      </main>
      <footer ref={footer} className={twMerge('docs-footer', width, hidden)}>
        <div className="docs-footer-panel">
          <p className="m-0">
            Released under the MIT License. Material Design is a trademark of Google LLC. This
            project is independent and is not affiliated with or endorsed by Google.
          </p>
          <div className="flex items-center gap-space-300">
            <Version />
            <Link href={site.repository} target="_blank" rel="noreferrer" className="docs-link">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </>
  )
}

/**
 * The site around a page: the destinations in a navigation rail, or behind an app bar's menu
 * in a compact window, the search over the page, and a written page's header, tabs, contents
 * and neighbours around it.
 */
export default function Shell() {
  const location = useLocation()
  const path = normalize(location.pathname)
  const page = pageAt(path)
  // A page written in MDX exports what its route hands over. Of the site's own pages, one
  // that fills the window says so; the others are no wider than a written page's header.
  const handle = useMatches().at(-1)?.handle as PageHandle | { isFullWidth: true } | undefined
  const written = handle && 'headings' in handle ? handle : undefined
  const width = handle && 'isFullWidth' in handle ? '' : 'max-w-440'
  // Kept as it is while a press hides it, which then redraws the rail and the title alone.
  const content = useMemo(
    () => (written && page ? <WrittenPage key={path} page={page} handle={written} /> : <Outlet />),
    [written, page, path],
  )
  // From the press that leaves the page, the rail and the title are the next page's.
  const leaving = useLeaving()
  const isLeaving = leaving?.key === location.key
  const shownPath = isLeaving ? leaving.path : path
  const shown = pageAt(shownPath)
  const [isSearchOpen, setSearchOpen] = useState(false)
  // The page's name, as a link to it shows it, and the window's title: an address the site
  // has no page at is a page not found.
  const name = shown === home ? site.title : (shown?.title ?? 'Page not found')
  const title = shown === home ? site.title : `${name} – ${site.title}`
  const description = shown?.description ?? site.description
  return (
    <div className="docs-shell">
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={site.title} />
      <meta property="og:title" content={name} />
      <meta property="og:description" content={description} />
      <a
        href="#main-content"
        className="docs-skip-link"
        onClick={(event) => {
          // The focus moves to the page, and the address stays the page's own.
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      <Rail path={shownPath} openSearch={() => setSearchOpen(true)} />
      <div className="docs-column">
        <TopBar path={shownPath} openSearch={() => setSearchOpen(true)} />
        <ShownPage key={path} width={width} isHidden={isLeaving}>
          {content}
        </ShownPage>
      </div>
      <SiteSearch isOpen={isSearchOpen} onOpenChange={setSearchOpen} />
    </div>
  )
}
