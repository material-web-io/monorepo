import { useEffect, useState, useSyncExternalStore } from 'react'

/**
 * Whether the element scrolls, there being more of it than its box shows, as its box and its
 * children change size and as what it holds changes: a box that does takes the focus, so that
 * the keyboard can scroll it.
 */
export function useScrolls(element: HTMLElement | null) {
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    if (!element) return
    const check = () =>
      setScrolls(
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
      )
    const resizes = new ResizeObserver(check)
    const observe = () => {
      resizes.observe(element)
      for (const child of element.children) resizes.observe(child)
    }
    observe()
    // A child added later is watched too, and content added deeper is checked at once.
    const mutations = new MutationObserver(() => {
      observe()
      check()
    })
    mutations.observe(element, { childList: true, subtree: true })
    return () => {
      resizes.disconnect()
      mutations.disconnect()
    }
  }, [element])
  return scrolls
}

/** Calls `listener` as the window scrolls or is resized, for `useSyncExternalStore`. */
export const subscribeToScroll = (listener: () => void) => {
  window.addEventListener('scroll', listener, { passive: true })
  window.addEventListener('resize', listener)
  return () => {
    window.removeEventListener('scroll', listener)
    window.removeEventListener('resize', listener)
  }
}

/**
 * The last of the elements with these ids that the page has scrolled past a line of the
 * window, `line()` pixels under its top: none in the built page, which has no window.
 */
export function useLastScrolledPast(ids: string[], line: () => number) {
  return useSyncExternalStore(
    subscribeToScroll,
    () => {
      const at = line()
      return ids.findLast(
        (id) => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) < at,
      )
    },
    () => undefined,
  )
}
