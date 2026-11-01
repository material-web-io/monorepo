import {
  createElement,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react'
import { mergeRefs } from 'react-aria'
import {
  ButtonContext,
  DEFAULT_SLOT,
  HeadingContext,
  LinkContext,
  Provider,
  TextContext,
} from 'react-aria-components'
import { ms } from '../../lib/motion'
import { tv, twMerge } from '../../lib/tv'
import { IconContext } from '../icon'
import { Ripple } from '../ripple'

export type AppBarVariant = 'small' | 'medium-flexible' | 'large-flexible'

export type AppBarScrollBehavior = 'pinned' | 'enter-always' | 'exit-until-collapsed'

/* The container (app-bar.css): a <header> across what it is in, square, on the surface, which
 * fills with surface-container on scroll. Its variant places its text, in the row or under it;
 * one that compresses keeps its row at the top as the text under it scrolls away. */
const appBar = tv({
  base: 'app-bar bg-surface',
  variants: {
    variant: {
      small: 'app-bar-small',
      'medium-flexible': 'app-bar-flexible app-bar-medium-flexible',
      'large-flexible': 'app-bar-flexible app-bar-large-flexible',
    },
    // One fill or the other, or of a bar that compresses as much of it as it has compressed.
    fill: {
      flat: 'transition-app-bar',
      scrolled: 'bg-surface-container transition-app-bar',
      collapse: 'app-bar-fill',
    },
    compress: { true: 'app-bar-compress', false: '' },
  },
  defaultVariants: { fill: 'flat', compress: false },
})

/** What scrolls under an app bar: its nearest ancestor that scrolls, or else the window. */
function scrollerOf(el: Element) {
  for (let node = el.parentElement; node && node !== document.body; node = node.parentElement)
    if (/auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return node
  return null
}

/**
 * Calls `frame` with how far along the default effects spring is, from 0 to 1, a frame at a
 * time until it is there, and returns what stops it. The spring is read where the bar is, so
 * the motion scheme applies, and with reduced motion it is there at once.
 */
function spring(el: HTMLElement, frame: (progress: number) => void) {
  if (typeof KeyframeEffect === 'undefined') {
    frame(1)
    return () => {}
  }
  const style = getComputedStyle(el)
  const duration = ms(
    style.getPropertyValue('--md-sys-motion-spring-default-effects-duration'),
    240,
  )
  const easing = style.getPropertyValue('--md-sys-motion-spring-default-effects-easing').trim()
  // An effect on nothing, for its timing alone, stepped by the frames' own times from the
  // moment of the first: a frame the page was late for has an old time, and would skip ahead.
  const effect = new KeyframeEffect(null, null, {
    duration,
    easing: easing || 'ease',
    fill: 'forwards',
  })
  const animation = new Animation(effect)
  animation.pause()
  let start: number | undefined
  let id = requestAnimationFrame(function tick(now) {
    start ??= performance.now()
    animation.currentTime = Math.max(0, now - start)
    const progress = effect.getComputedTiming().progress ?? 1
    frame(progress)
    if (progress < 1) id = requestAnimationFrame(tick)
  })
  return () => cancelAnimationFrame(id)
}

/**
 * The state an app bar takes from what scrolls under it: `scrolled` once that has, and
 * `collapsed` once a flexible bar is more its row than not. As that scrolls it sets the
 * properties app-bar.css reads, with no render in between.
 *
 * The behaviors are Compose's. A bar that is not pinned collapses by as much as is scrolled
 * down, a small one all of it and a flexible one down to its row. It expands by as much as is
 * scrolled up, wherever in the page that is (`enter-always`), or only as the page comes back
 * to its top (`exit-until-collapsed`). One a scroll leaves part way settles on the nearer
 * end, and takes the page with it, as the content under a Compose bar follows it.
 */
function useScrollBehavior(
  bar: RefObject<HTMLElement | null>,
  behavior: AppBarScrollBehavior,
  flexible: boolean,
) {
  const [scrolled, setScrolled] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const el = bar.current
    if (!el) return
    const scroller = scrollerOf(el)
    const target = scroller ?? window
    const position = () => Math.max(0, scroller ? scroller.scrollTop : window.scrollY)
    const passive = { passive: true }
    // A pinned bar only says whether the page has scrolled under it.
    if (behavior === 'pinned') {
      const read = () => setScrolled(position() > 0)
      target.addEventListener('scroll', read, passive)
      read()
      return () => target.removeEventListener('scroll', read)
    }

    const always = behavior === 'enter-always'
    // How much of the bar can go: all of a small one, and all under its row of a flexible one,
    // the row being as tall as the pseudo-element across it (app-bar.css).
    const row = () => Number.parseFloat(getComputedStyle(el, '::before').height) || 0
    const room = () => el.offsetHeight - (flexible ? row() : 0)

    // How far above the top of what scrolls the bar is drawn.
    const above = () => {
      const top = scroller ? scroller.getBoundingClientRect().top + scroller.clientTop : 0
      return Math.max(0, top - el.getBoundingClientRect().top)
    }
    // How far above it the bar is let go (app-bar.css): all the way where the page has the bar,
    // which then moves it itself, sooner than a scroll event could, and as far as has gone else.
    const hold = (top: number) => {
      el.style.setProperty('--app-bar-top', `${-top}px`)
      return top
    }

    // Read once it is laid out (update).
    let last = 0
    let limit = 0
    let held = 0
    let gone = 0
    let settling: (() => void) | undefined
    let touched = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const draw = (at: number) => {
      gone = Math.max(0, Math.min(gone, limit))
      // Drawn short of where it is let go, the bar is where the page has it, near the top of
      // the page: it has gone no further than that.
      const drawn = above()
      const paged = drawn < held - 0.5
      if (paged && gone > drawn - 0.5) gone = drawn
      held = hold((paged && gone === drawn) || gone === limit ? limit : gone)
      if (flexible) {
        const collapse = limit > 0 ? gone / limit : at > 0 ? 1 : 0
        el.style.setProperty('--app-bar-collapse', String(collapse))
        // Compose swaps which of its two titles is read out half way, and so does this.
        setCollapsed(collapse >= 0.5)
      }
      setScrolled(at > 0)
    }

    const stop = () => {
      settling?.()
      settling = undefined
    }

    const update = () => {
      // A bar in a hidden tab has no height to read: it keeps what it had until it is shown.
      if (!el.offsetHeight) return
      const at = position()
      // A scroll that is not the settle's own is the user's, who has it from here.
      if (Math.abs(at - last) > 0.5) stop()
      const next = room()
      // The first reading lets it go all the way, and finds how much of it the page has taken.
      // A small bar that enters always starts whole, wherever the page is.
      if (!limit) {
        last = at
        held = hold(next)
        gone = always && !flexible ? 0 : next
      }
      // A bar that had all gone stays so when its height changes, as a headline that wraps does.
      if (limit > 0 && gone >= limit) gone = next
      limit = next
      // One that exits until collapsed is only ever where the page has it.
      gone = always ? gone + at - last : limit
      last = at
      draw(at)
    }

    const settle = () => {
      if (settling || touched || gone < 0.5 || gone > limit - 0.5) return
      const from = gone
      const by = (gone / limit < 0.5 ? 0 : limit) - gone
      const start = position()
      settling = spring(el, (progress) => {
        target.scrollTo({ top: start + by * progress, behavior: 'instant' })
        last = position()
        gone = from + by * progress
        draw(last)
        if (progress === 1) settling = undefined
      })
    }

    // A scroll has ended when the browser says so, or else once no more is heard of it for a
    // moment. Nothing settles under a finger.
    const native = 'onscrollend' in window
    const later = () => {
      clearTimeout(timer)
      timer = setTimeout(settle, 150)
    }
    const scroll = () => {
      update()
      if (native) clearTimeout(timer)
      else later()
    }
    // What the user does next ends a settle: theirs is the scroll that follows. It is looked
    // at again in a moment, since that may have scrolled nothing.
    const interrupt = () => {
      if (!settling) return
      stop()
      later()
    }
    const touch = () => {
      touched = true
      interrupt()
    }
    const lift = () => {
      touched = false
      later()
    }

    const interrupts = ['wheel', 'pointerdown', 'keydown'] as const
    const lifts = ['touchend', 'touchcancel'] as const
    target.addEventListener('scroll', scroll, passive)
    target.addEventListener('scrollend', settle)
    target.addEventListener('touchstart', touch, passive)
    for (const type of interrupts) target.addEventListener(type, interrupt, passive)
    for (const type of lifts) target.addEventListener(type, lift, passive)
    // Read once it is laid out, and again when its height changes, as a headline that wraps does.
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(el)
    return () => {
      target.removeEventListener('scroll', scroll)
      target.removeEventListener('scrollend', settle)
      target.removeEventListener('touchstart', touch)
      for (const type of interrupts) target.removeEventListener(type, interrupt)
      for (const type of lifts) target.removeEventListener(type, lift)
      observer?.disconnect()
      clearTimeout(timer)
      stop()
      for (const name of ['--app-bar-top', '--app-bar-collapse']) el.style.removeProperty(name)
    }
  }, [bar, behavior, flexible])

  // A flexible bar that collapses fills as it does: it is scrolled once it is small.
  const collapses = flexible && behavior !== 'pinned'
  return { scrolled: collapses ? collapsed : scrolled, collapsed: collapses && collapsed }
}

// Gives `copy` what `original` holds and its classes after `className`, ids left out.
function mirror(copy: Element, original: Element, className: string) {
  copy.replaceChildren(...[...original.childNodes].map((node) => node.cloneNode(true)))
  for (const element of copy.querySelectorAll('[id]')) element.removeAttribute('id')
  copy.className = twMerge(className, original.className)
}

/**
 * A part of the text drawn again, in the row of a bar that compresses, in the small title's
 * class (app-bar.css): an element of the same tag as the one drawn, right after it, whose
 * content and classes it copies as they change, without their event handlers. It copies the
 * element drawn, since React Aria hands a `render` no `level` and no `elementType`. Only one of
 * the two is read out, in the same place: this one once the bar is collapsed, the one as written
 * until then.
 */
function Copy({
  of: original,
  className,
  isRead,
}: {
  of: HTMLElement
  className: string
  isRead: boolean
}) {
  // Its element is new with each element drawn, since an element of another tag is one.
  const copy = useMemo(() => document.createElement(original.localName), [original])
  useLayoutEffect(() => {
    original.after(copy)
    mirror(copy, original, className)
    const observer = new MutationObserver(() => mirror(copy, original, className))
    observer.observe(original, {
      subtree: true,
      childList: true,
      characterData: true,
      attributeFilter: ['class'],
    })
    return () => {
      observer.disconnect()
      copy.remove()
    }
  }, [copy, original, className])
  useLayoutEffect(() => {
    if (isRead) copy.removeAttribute('aria-hidden')
    else copy.setAttribute('aria-hidden', 'true')
  }, [copy, isRead])
  return null
}

// The search bar draws its ripple first, in the state layer's color, then its children.
function withRipple(tag: 'button' | 'a') {
  return (props: { children?: ReactNode }) =>
    createElement(tag, props, <Ripple variant="on-surface" />, props.children)
}

/* React Aria's slots in the bar (app-bar.css): a Heading takes `headline`, an `<h1>` unless its
 * `level` says otherwise, a Text `subtitle`, a Button or a Link `search`, the search bar, which
 * is given its ripple, and either `leading`, `trailing` or none, as an Icon does. Any other slot
 * throws, as React Aria's do; an element of yours is placed by its slot alone. */
function AppBarSlots({
  compress,
  collapsed,
  children,
}: {
  compress: boolean
  collapsed: boolean
  children: ReactNode
}) {
  // A bar that compresses draws its headline and subtitle again, as the small title: it is
  // handed the elements drawn, which it copies.
  const [headline, setHeadline] = useState<HTMLElement | null>(null)
  const [subtitle, setSubtitle] = useState<HTMLElement | null>(null)
  const text = compress ? { 'aria-hidden': collapsed || undefined } : {}
  return (
    <Provider
      values={[
        [
          HeadingContext,
          { slots: { headline: { level: 1, ...text, ref: compress ? setHeadline : undefined } } },
        ],
        [
          TextContext,
          { slots: { subtitle: { ...text, ref: compress ? setSubtitle : undefined } } },
        ],
        [
          ButtonContext,
          {
            slots: {
              [DEFAULT_SLOT]: {},
              leading: {},
              trailing: {},
              search: { render: withRipple('button') },
            },
          },
        ],
        [
          LinkContext,
          {
            slots: {
              [DEFAULT_SLOT]: {},
              leading: {},
              trailing: {},
              search: { render: withRipple('a') },
            },
          },
        ],
        [IconContext, { slots: { [DEFAULT_SLOT]: {}, leading: {}, trailing: {} } }],
      ]}
    >
      {children}
      {compress && headline && (
        <Copy of={headline} className="app-bar-collapsed-headline" isRead={collapsed} />
      )}
      {compress && subtitle && (
        <Copy of={subtitle} className="app-bar-collapsed-subtitle" isRead={collapsed} />
      )}
    </Provider>
  )
}

// The props `AppBar` adds to the native `<header>` ones. The comments on them quote the
// M3 app bars pages, which each comment lists under @see; they add no wording of our own.
type AppBarBaseProps = {
  // A search app bar is a small one with a search bar in its `search` slot.
  /**
   * Four variants: Search app bar, small, medium flexible, large flexible
   *
   * - `small`: Use in dense layouts or when a page is scrolled.
   * - `medium-flexible`: Use to display a larger headline. It can collapse
   *   into a small app bar on scroll.
   * - `large-flexible`: Use to emphasize the headline of the page.
   *
   * Search app bar: Use on home pages when search is key to the product.
   *
   * @default 'small'
   * @see https://m3.material.io/components/app-bars/overview
   * @see https://m3.material.io/components/app-bars/guidelines
   */
  variant?: AppBarVariant

  // Compose's three, by its names. The bar stays at the top of the nearest ancestor that
  // scrolls, or of the page, and reads `isScrolled` from it. One that is not pinned collapses
  // on scroll: a small bar to nothing, a flexible one to its row.
  /**
   * The app bar can remain on a page at all times, or can hide and reappear
   * when scrolling.
   *
   * Upon scrolling, an app bar container fills with contrasting color to
   * create a visual separation
   *
   * Medium and large flexible app bars can use the compress effect to
   * transform into small app bars when scrolled
   *
   * When scrolled, medium flexible and large flexible app bars can transform
   * into small app bars. They should remain small until the page is scrolled
   * back to the top. Don’t transform app bars into a search app bar.
   *
   * - `enter-always`: When the user pulls up the scaffold's inner content,
   *   the top app bar collapses. The app bar expands when the user starts
   *   pulling down the inner content.
   * - `exit-until-collapsed`: Similar to `enterAlwaysScrollBehavior`, though
   *   the app bar only expands when the user pulls the content all the way
   *   down.
   * - `pinned`: The app bar remains in place and does not react to scrolling.
   *
   * @default 'pinned'
   * @see https://m3.material.io/components/app-bars/guidelines
   * @see https://developer.android.com/develop/ui/compose/components/app-bars#scroll
   */
  scrollBehavior?: AppBarScrollBehavior

  // Left out, the bar reads it from what scrolls under it. Yours to set to overrule that.
  /**
   * All app bars share the same color roles. On scroll, the container
   * changes color to surface container.
   *
   * App bars should initially be the same color as the background, then fill
   * with a contrasting color on scroll to provide visual separation from the
   * background.
   *
   * The app bar changes color when flat or on scroll. The search bar can
   * also change color on scroll.
   *
   * @see https://m3.material.io/components/app-bars/specs
   * @see https://m3.material.io/components/app-bars/guidelines
   */
  isScrolled?: boolean
}

export type AppBarProps = ComponentProps<'header'> & AppBarBaseProps

// `className`, `style`, the ref and the rest go on the `<header>`, which draws its children as
// written, each where its slot has it: what leads, such as an `IconButton`, in `leading`; the
// headline, React Aria's `Heading` in `headline`, and the subtitle, its `Text` in `subtitle`, or
// the search bar, its `Button` in `search`; what trails in `trailing`: icon buttons, an avatar,
// or anything else, up to three. The bar itself is no tab stop, and the controls in it
// are, in the order written. The text starts at the leading edge: `text-center` on the bar
// centers it, in the row between what leads and what trails, and across a flexible bar.
/**
 * App bars are placed at the top of the screen to help people navigate
 * through a product.
 *
 * Focus on describing the current page and provide 1–2 essential actions
 *
 * Displays labels and page navigation controls at the top of the page. (Use
 * a toolbar to display page actions)
 *
 * On scroll, apply a fill color to separate from body content
 *
 * Always use the default height of the app bar, and make it span the full
 * width of the window.
 *
 * The app bar automatically supports right-to-left (RTL) languages by
 * aligning the layout of elements to the leading and trailing edges of the
 * container.
 *
 * Focus should initially land on the leading button, since it’s the first
 * interactive element of the app bar.
 *
 * Keyboard navigation:
 * - Tab: Move focus to the next interactive element
 * - Space or Enter: Activate the focused element
 *
 * App bars show information about the page, key actions, and navigation
 * actions like Back or Menu
 *
 * The leading button should be used for navigating the product.
 *
 * It typically is one of the following:
 *
 * - A menu icon, which opens a modal expanded navigation rail
 * - A back arrow, which returns to the previous screen
 *
 * The headline can describe:
 *
 * - The current page
 * - The current section
 * - The product
 *
 * Headline text should be brief enough to easily fit in the app bar.
 *
 * In medium flexible and large flexible app bars, the headline can wrap to
 * a second line.
 *
 * Don’t truncate the headline text.
 *
 * Headline typography style for each app bar
 *
 * - Small: Title large
 * - Medium flexible: Headline medium
 * - Large flexible: Display small
 *
 * Subtitles can add additional context to a page.
 *
 * Subtitle typography style for each app bar:
 *
 * - Small: Label medium
 * - Medium flexible: Label large
 * - Large flexible: Title medium
 *
 * The medium flexible and large flexible app bars hug the text contents, so
 * they are taller when a subtitle is visible
 *
 * Text labels, including supporting text, can be aligned to the leading edge
 * or centered
 *
 * An image can be placed in the app bar. In small app bars, this can
 * replace the label text.
 *
 * The accessibility label for a title should be the same as the content
 * within the title. If needed, add additional context to the accessibility
 * label to ensure users understand what page they’re on or what content is
 * being shown.
 *
 * Up to two icon buttons can be placed after the headline, aligned to the
 * trailing edge of the app bar. Place most-used actions closest to the
 * leading edge.
 *
 * Avoid using these buttons to open a menu with more actions. If more
 * actions are needed, place them in a toolbar instead.
 *
 * If changing the icon button color style to filled or tonal, only use one
 * icon button.
 *
 * App bars can be customized to include:
 *
 * - An image or logo
 * - A subtitle
 * - A filled icon button
 *
 * Avoid customizing the size of the heading and subtitle, or adding too
 * many actions.
 *
 * Use a search app bar to provide an emphasized entry-point to open the
 * search view.
 *
 * Search app bars have a search field instead of heading text
 *
 * Selecting the search bar should open the search view component.
 *
 * The search container of the search app bar should fill 100% of the space
 * between leading and trailing app bar elements until it reaches 312dp. Then,
 * it should only grow further to fill 50% of that space.
 *
 * On search app bars, use the default color roles when possible.
 *
 * - Search container: surface container
 * - Search label: on surface variant
 *
 * @see https://m3.material.io/components/app-bars/overview
 * @see https://m3.material.io/components/app-bars/guidelines
 * @see https://m3.material.io/components/app-bars/accessibility
 * @see https://m3.material.io/components/app-bars/specs
 */
export function AppBar({
  variant = 'small',
  scrollBehavior = 'pinned',
  isScrolled,
  className,
  ref,
  children,
  ...props
}: AppBarProps) {
  const flexible = variant !== 'small'
  // A flexible bar that collapses on scroll compresses into its row, a small app bar.
  const compress = flexible && scrollBehavior !== 'pinned'

  const bar = useRef<HTMLElement>(null)
  const barRef = useMemo(() => mergeRefs(bar, ref), [ref])
  const state = useScrollBehavior(bar, scrollBehavior, flexible)
  const scrolled = isScrolled ?? state.scrolled
  const { collapsed } = state

  // A bar that compresses fills by how far it has, unless it is told whether it is scrolled.
  const fill = compress && isScrolled === undefined ? 'collapse' : scrolled ? 'scrolled' : 'flat'

  return (
    <header
      {...props}
      ref={barRef}
      data-scrolled={scrolled || undefined}
      data-collapsed={collapsed || undefined}
      className={appBar({ variant, fill, compress, className })}
    >
      <AppBarSlots compress={compress} collapsed={collapsed}>
        {children}
      </AppBarSlots>
    </header>
  )
}
