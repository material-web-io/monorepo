import {
  AppBar,
  Fab,
  Icon,
  IconButton,
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
  NavigationRailSection,
  Ripple,
  Tooltip,
  TooltipTrigger,
  twMerge,
} from '@material-web/react'
import { useEffect, useRef, useState } from 'react'
import { useFocusVisible } from 'react-aria'
import {
  Button,
  Dialog,
  Disclosure,
  DisclosurePanel,
  Heading,
  Link,
  Modal,
  ModalOverlay,
  Text,
} from 'react-aria-components'
import { useSiteNavigate } from '../leaving'
import { entriesOf, home, sectionOf, sections, site, type Page, type Section } from '../nav'
import { SettingsMenu, ThemeToggle } from './settings-menu'

const destinations = [home, ...sections]
const sectionAt = (path: string) => sections.find((section) => section.path === path)

type RailProps = {
  /** The path of the page shown. */
  path: string
  openSearch: () => void
}

// How long the pointer or the focus stays on a part of the rail before the drawer follows it.
const restDelay = 200

/**
 * The site's destinations, in a navigation rail beside the page: the search button over them
 * and the theme's switches under them. A destination the pointer or the keyboard's focus rests
 * on brings a drawer with the list of its pages out from under the rail, over the page; a part
 * of the rail with no pages, or the pointer leaving, puts it back. In a window with room for
 * it, the drawer stays beside the rail with the list of the section the page is in, the page
 * starts after it, and another destination's list takes that list's place for as long. A
 * list has the section's groups of pages as one entry each, which a press opens and closes.
 */
export function Rail({ path, openSearch }: RailProps) {
  const navigate = useSiteNavigate()
  const section = sectionOf(path)
  const current = section ?? home
  const { isFocusVisible } = useFocusVisible()
  // The section last pointed at, and the page its list was opened on: on another, it is closed.
  const [listed, setListed] = useState<Section>()
  const [openedAt, setOpenedAt] = useState<string>()
  const pointed = openedAt === path ? listed : undefined
  // The page a press was made on: until the next one, the drawer is put back where it leaves.
  const [pressedAt, setPressedAt] = useState<string>()
  // What the pointer or the focus has come to: a section, or `null` where there is no list.
  const [rested, setRested] = useState<Section | null>()
  useEffect(() => {
    if (rested === undefined) return
    const timer = setTimeout(() => {
      if (rested) setListed(rested)
      setOpenedAt(rested ? path : undefined)
      setPressedAt(undefined)
      setRested(undefined)
    }, restDelay)
    return () => clearTimeout(timer)
  }, [rested, path])
  const settle = () => {
    setRested(undefined)
    setOpenedAt(undefined)
  }
  // The groups of pages that are open, by title: each stays as a press leaves it, and the one
  // the page shown is in opens as the page arrives.
  const group = section?.groups?.find((group) => group.paths?.includes(path))?.title
  const [expanded, setExpanded] = useState(group ? [group] : [])
  const [arrivedAt, setArrivedAt] = useState(path)
  if (arrivedAt !== path) {
    setArrivedAt(path)
    if (group && !expanded.includes(group)) setExpanded([...expanded, group])
  }
  // The page's own list shows the link of the page shown, in its middle when it was out of sight.
  const own = useRef<HTMLElement>(null)
  useEffect(() => {
    const list = own.current
    const link = list?.querySelector<HTMLElement>('[aria-current]')
    if (!list || !link) return
    const top = link.offsetTop - list.scrollTop
    if (top < 0 || top + link.offsetHeight > list.clientHeight)
      list.scrollTop = link.offsetTop - (list.clientHeight - link.offsetHeight) / 2
  }, [path])
  // The list in sight is the one pointed at. With none, it is the last one pointed at, which
  // the drawer leaves with, or the page's own: always so in a window where the drawer stays.
  const shown = pointed ?? listed ?? section
  const shownWide = pointed ?? section ?? listed
  const link = ({ path: href, title }: Pick<Page, 'path' | 'title'>) => (
    <Link
      key={href}
      href={href}
      aria-current={href === path ? 'page' : undefined}
      className={twMerge('docs-drawer-link', href === path ? 'docs-drawer-link-current' : '')}
      onPress={() => setPressedAt(path)}
    >
      <Ripple />
      {title}
    </Link>
  )
  return (
    <div
      className="docs-rail"
      onPointerLeave={settle}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) settle()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') settle()
      }}
    >
      <nav aria-label="Main" className="docs-rail-bar">
        <NavigationRail className="flex-1 bg-transparent">
          <NavigationRailHeader className="mt-space-200 mb-space-200">
            <TooltipTrigger>
              <Fab aria-label="Search" color="tertiary-container" onPress={openSearch}>
                <Icon name="search" />
              </Fab>
              <Tooltip placement="end">Search</Tooltip>
            </TooltipTrigger>
          </NavigationRailHeader>
          {destinations.map(({ path: href, icon, title }) => (
            <NavigationRailItem
              key={href}
              isSelected={current.path === href}
              onPress={() => {
                setRested(undefined)
                setPressedAt(path)
                navigate(href)
              }}
              onHoverStart={() => setRested(sectionAt(href) ?? null)}
              onHoverEnd={() => setRested(null)}
              onFocusChange={(isFocused) => {
                if (isFocused && isFocusVisible) setRested(sectionAt(href) ?? null)
              }}
            >
              <Icon name={icon} />
              <Text slot="label">{title}</Text>
            </NavigationRailItem>
          ))}
        </NavigationRail>
        <div className="docs-rail-actions">
          <SettingsMenu placement="end bottom" />
          <ThemeToggle placement="end" />
        </div>
      </nav>
      <div
        className={twMerge(
          'docs-drawer',
          pointed && pressedAt !== path ? 'max-extra-large-screen:docs-drawer-open' : '',
          pointed ? 'extra-large-screen:docs-drawer-open' : '',
          section ? 'extra-large-screen:docs-drawer-kept' : '',
        )}
        onPointerEnter={() => setRested(undefined)}
        onPointerLeave={() => setRested(null)}
      >
        {sections.map((list) => (
          <nav
            key={list.path}
            ref={list === section ? own : undefined}
            aria-label={list.title}
            className={twMerge(
              'docs-drawer-list',
              list === shown ? 'max-extra-large-screen:docs-drawer-list-shown' : '',
              list === shownWide ? 'extra-large-screen:docs-drawer-list-shown' : '',
            )}
          >
            {link({ path: list.path, title: `${list.title} overview` })}
            {entriesOf(list).map((entry) =>
              'pages' in entry ? (
                <Disclosure
                  key={entry.title}
                  isExpanded={expanded.includes(entry.title)}
                  onExpandedChange={(isExpanded) =>
                    setExpanded(
                      isExpanded
                        ? [...expanded, entry.title]
                        : expanded.filter((title) => title !== entry.title),
                    )
                  }
                  className="docs-drawer-group"
                >
                  <Button slot="trigger" className="docs-drawer-group-button">
                    <Ripple />
                    {entry.title}
                    <Icon
                      name={expanded.includes(entry.title) ? 'arrow_drop_up' : 'arrow_drop_down'}
                      className="icon-24"
                    />
                  </Button>
                  <DisclosurePanel className="docs-drawer-group-pages">
                    {entry.pages.map(link)}
                  </DisclosurePanel>
                </Disclosure>
              ) : (
                link(entry)
              ),
            )}
          </nav>
        ))}
      </div>
    </div>
  )
}

/**
 * A compact window's navigation: an app bar over the page, with the menu button that opens the
 * destinations, an expanded navigation rail in a modal that comes in from the window's edge.
 */
export function TopBar({ path, openSearch }: RailProps) {
  const navigate = useSiteNavigate()
  const section = sectionOf(path)
  const current = section ?? home
  const [isOpen, setOpen] = useState(false)
  const go = (href: string) => {
    setOpen(false)
    navigate(href)
  }
  return (
    <div className="docs-top-bar">
      <AppBar>
        <IconButton slot="leading" aria-label="Open navigation" onPress={() => setOpen(true)}>
          <Icon name="menu" />
        </IconButton>
        <Heading slot="headline" level={2}>
          {site.shortTitle}
        </Heading>
        <IconButton slot="trailing" aria-label="Search" onPress={openSearch}>
          <Icon name="search" />
        </IconButton>
        <SettingsMenu slot="trailing" placement="bottom end" />
        <ThemeToggle slot="trailing" placement="bottom" />
      </AppBar>
      <ModalOverlay
        isDismissable
        isOpen={isOpen}
        onOpenChange={setOpen}
        className="docs-menu-scrim"
      >
        <Modal className="docs-menu">
          <Dialog aria-label="Navigation" className="outline-none">
            <nav aria-label="Main" className="flex min-h-dvh">
              <NavigationRail isExpanded className="bg-transparent">
                <NavigationRailHeader>
                  <IconButton aria-label="Close navigation" onPress={() => setOpen(false)}>
                    <Icon name="menu_open" />
                  </IconButton>
                </NavigationRailHeader>
                {destinations.map(({ path: href, icon, title }) => (
                  <NavigationRailItem
                    key={href}
                    isSelected={current.path === href}
                    onPress={() => go(href)}
                  >
                    <Icon name={icon} />
                    <Text slot="label">{title}</Text>
                  </NavigationRailItem>
                ))}
                {section && (
                  <NavigationRailSection aria-labelledby="docs-menu-section">
                    {/* Not React Aria's Text: in a Dialog, its only slot is the description. */}
                    <span slot="header" id="docs-menu-section">
                      {section.title}
                    </span>
                    {section.pages.map(({ path: href, title }) => (
                      <NavigationRailItem
                        key={href}
                        isSelected={href === path}
                        onPress={() => go(href)}
                      >
                        <Text slot="label">{title}</Text>
                      </NavigationRailItem>
                    ))}
                  </NavigationRailSection>
                )}
              </NavigationRail>
            </nav>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}
