import { Icon, IconButton, Tooltip, TooltipTrigger, twMerge } from '@material-web/react'
import type { MDXComponents } from 'mdx/types'
import {
  createContext,
  createElement,
  use,
  useEffect,
  useId,
  useState,
  type ComponentProps,
  type JSX,
  type ReactNode,
} from 'react'
import { Link, TabPanel } from 'react-aria-components'
import { useScrolls } from '../scroll'
import { Pre } from './code'
import { Example } from './example'
import { PropsTable } from './props-table'
import { Setups, When } from './setups'
import { snackbars } from './snackbars'

/* An element of a page's MDX with the class that styles it: the class is the element's own,
 * so that the same element in an example, drawn inside the page, is left as it is. */
function styled<Tag extends keyof JSX.IntrinsicElements>(tag: Tag, className: string) {
  return function Styled(props: ComponentProps<Tag>) {
    return createElement(tag, { ...props, className })
  }
}

/* The button that copies the link to a heading, named after the heading it is beside: for a
 * moment after it has, it is filled and its tooltip says so, to a screen reader too. */
function CopyLink({ heading }: { heading: string }) {
  const id = useId()
  const [isCopied, setCopied] = useState(false)
  useEffect(() => {
    if (!isCopied) return
    const timer = setTimeout(() => setCopied(false), 1000)
    return () => clearTimeout(timer)
  }, [isCopied])
  return (
    <span className="docs-heading-copy">
      <TooltipTrigger shouldCloseOnPress={false}>
        <IconButton
          id={id}
          aria-label="Copy link to"
          aria-labelledby={`${id} ${heading}`}
          className={
            isCopied ? 'bg-tertiary-container text-on-tertiary-container' : 'text-on-surface'
          }
          onPress={async () => {
            try {
              await navigator.clipboard.writeText(new URL(`#${heading}`, window.location.href).href)
              setCopied(true)
            } catch {
              // On an insecure origin, or with the permission denied.
              snackbars.add('Couldn’t copy link', { timeout: 4000 })
            }
          }}
        >
          <Icon name="link" />
        </IconButton>
        <Tooltip placement="bottom">{isCopied ? 'Link copied' : 'Copy link'}</Tooltip>
      </TooltipTrigger>
      <span aria-live="polite" className="sr-only">
        {isCopied && 'Link copied'}
      </span>
    </span>
  )
}

/* A heading of a page, in a box with its type and the room around it, which holds in the
 * margin before it the button that copies the link to it. */
export function heading(Tag: 'h2' | 'h3' | 'h4', className: string) {
  return function Heading({ id, ...props }: ComponentProps<'h2'>) {
    return (
      <div className={twMerge('group/heading', className)}>
        <Tag {...props} id={id} className="docs-heading" />
        {id && <CopyLink heading={id} />}
      </div>
    )
  }
}

// A link to another site opens beside this one; one to a page here goes through the router.
function Anchor({ href = '', children }: ComponentProps<'a'>) {
  const isExternal = /^[a-z]+:/.test(href)
  return (
    <Link
      href={href}
      className="docs-link"
      {...(isExternal && { target: '_blank', rel: 'noreferrer' })}
    >
      {children}
    </Link>
  )
}

// A note set apart from the text, which a page writes as a quote: a symbol beside what it says.
export function Note({ children }: ComponentProps<'blockquote'>) {
  return (
    <div role="note" className="docs-note">
      <Icon name="info" className="flex-none icon-24" />
      <div className="docs-note-text">{children}</div>
    </div>
  )
}

// A table scrolls sideways in its own box where the page is too narrow for it, and the box
// then takes the focus, so that the keyboard can scroll it.
function Table(props: ComponentProps<'table'>) {
  const [box, setBox] = useState<HTMLDivElement | null>(null)
  const scrolls = useScrolls(box)
  return (
    <div ref={setBox} tabIndex={scrolls ? 0 : undefined} className="docs-table">
      <table {...props} className="docs-table-grid" />
    </div>
  )
}

/**
 * The side the tab shown comes in from, once the reader turns from the one the page opened on:
 * the end for a tab after the one left, the start for one before it (shell.tsx).
 */
export const TabTurn = createContext<'start' | 'end' | undefined>(undefined)

const enterFrom = { start: 'docs-enter-from-start', end: 'docs-enter-from-end' }

/* A tab of a page, which the build cuts the page into (remark-handle): each stays in the page,
 * for the browser's search and the links to its headings, and all but the one picked is hidden.
 * Picked, it comes in from the side it was turned to from. */
function PageTab({ id, children }: { id: string; children: ReactNode }) {
  const from = use(TabTurn)
  return (
    <TabPanel
      id={id}
      shouldForceMount
      className={({ isInert }) =>
        isInert ? 'hidden' : twMerge('docs-tab-panel', from && enterFrom[from])
      }
    >
      {children}
    </TabPanel>
  )
}

/** What a page's MDX is drawn with: its elements, and the components every page may use. */
export const mdxComponents: MDXComponents = {
  h2: heading('h2', 'docs-h2'),
  h3: heading('h3', 'docs-h3'),
  h4: heading('h4', 'docs-h4'),
  p: styled('p', 'docs-p'),
  ul: styled('ul', 'docs-list'),
  ol: styled('ol', 'docs-list'),
  li: styled('li', 'docs-list-item'),
  blockquote: Note,
  hr: styled('hr', 'docs-rule'),
  th: styled('th', 'docs-th'),
  td: styled('td', 'docs-td'),
  code: styled('code', 'docs-inline-code'),
  a: Anchor,
  pre: Pre,
  table: Table,
  Example,
  PageTab,
  PropsTable,
  Setups,
  When,
}
