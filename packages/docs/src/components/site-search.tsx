import { Icon, IconButton, List, ListItem, SearchField, SearchView } from '@material-web/react'
import { useEffect, useRef, useState } from 'react'
import { Autocomplete, Input, Text, useFilter } from 'react-aria-components'
import { useSiteNavigate } from '../leaving'
import { useMediaQuery } from '../media'
import { home, sectionOf, sections, type Page } from '../nav'

type Result = { href: string; title: string; context: string; icon: string }

const label = 'Search the documentation'

const resultOf = (page: Page): Result => {
  const section = sectionOf(page.path)
  const isSection = section === page
  return {
    href: page.path,
    title: page.title,
    context: isSection || !section ? page.description : section.title,
    icon: isSection ? section.icon : 'article',
  }
}

const pageResults = sections.flatMap((section) => [section, ...section.pages]).map(resultOf)

// The headings of every page, loaded when the search first opens.
function useHeadingResults() {
  const [results, setResults] = useState<Result[]>([])
  useEffect(() => {
    let isCurrent = true
    import('virtual:search').then(({ default: headings }) => {
      if (!isCurrent) return
      const pages = [home, ...sections.flatMap((section) => section.pages)]
      setResults(
        pages.flatMap((page) =>
          (headings[page.path] ?? []).map((heading) => ({
            href: `${page.path}#${heading.id}`,
            title: heading.text,
            context: page.title,
            icon: 'tag',
          })),
        ),
      )
    })
    return () => {
      isCurrent = false
    }
  }, [])
  return results
}

function Results({ close }: { close: () => void }) {
  const [query, setQuery] = useState('')
  const navigate = useSiteNavigate()
  const { contains } = useFilter({ sensitivity: 'base' })
  const headings = useHeadingResults()
  // The pages alone until something is typed, then their headings with them.
  const results = query ? [...pageResults, ...headings] : pageResults
  const open = (href: string) => {
    close()
    navigate(href)
  }
  return (
    <Autocomplete
      inputValue={query}
      onInputChange={setQuery}
      filter={contains}
      disableAutoFocusFirst
    >
      <SearchField
        autoFocus
        aria-label={label}
        onSubmit={() => {
          const first = results.find((result) => contains(result.title, query))
          if (first) open(first.href)
        }}
      >
        <Icon slot="leading" name="search" />
        <IconButton slot="leading" aria-label="Back" onPress={close}>
          <Icon name="arrow_back" />
        </IconButton>
        <Input placeholder="Search" />
        <IconButton aria-label="Clear search">
          <Icon name="close" />
        </IconButton>
      </SearchField>
      <List
        aria-label="Pages"
        items={results}
        onAction={(key) => open(String(key))}
        renderEmptyState={() => <p className="docs-search-empty">No page or heading matches.</p>}
      >
        {(result) => (
          <ListItem id={result.href} textValue={result.title} className="bg-transparent">
            <Icon slot="leading" name={result.icon} />
            <Text slot="label">{result.title}</Text>
            <Text slot="description">{result.context}</Text>
          </ListItem>
        )}
      </List>
    </Autocomplete>
  )
}

/**
 * The search of the site's pages and their headings, opened by the rail's search button or the
 * app bar's: across the top of the page, beside the rail, or all of a compact window.
 */
export function SiteSearch({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}) {
  const isCompact = useMediaQuery('(max-width: 599px)')
  // Where the view is drawn: a search view takes the box of what opened it.
  const place = useRef<HTMLDivElement>(null)
  return (
    <>
      <div ref={place} className="docs-search-place" />
      <SearchView
        aria-label={label}
        layout={isCompact ? 'full-screen' : 'docked'}
        triggerRef={place}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
      >
        {({ state }) => <Results close={state.close} />}
      </SearchView>
    </>
  )
}
