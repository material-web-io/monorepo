import { useSyncExternalStore } from 'react'
import { resolvePath, useHref, useLocation, useNavigate, type NavigateOptions } from 'react-router'
import { normalize } from './nav'

/* A change of page, as on m3.material.io: at the press, the address and the navigation go to the
 * next page and the page shown is hidden; the next comes in once the hold (docs-enter) has run
 * (Shell). The page left is named by its location's key, which the next location has not. */

type Leaving = {
  key: string
  /** The path of the page gone to. */
  path: string
  /** Whether the address was put in an entry of its own, which the router has yet to take over. */
  isPushed: boolean
  at: number
}

let leaving: Leaving | undefined
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}
const snapshot = () => leaving
const noSnapshot = () => undefined

/** The page being left, by its location's key, for which page, and when, until it is shown. */
export const useLeaving = () => useSyncExternalStore(subscribe, snapshot, noSnapshot)

/** Leaves the page whose location has `key` for the page at `path`; with none, stays. */
export function leave(next?: Omit<Leaving, 'at'>) {
  leaving = next && { ...next, at: performance.now() }
  for (const listener of listeners) listener()
}

/** What was being left, as the next page is shown: nothing is, after it. */
export function arrive() {
  const left = leaving
  leaving = undefined
  return left
}

/**
 * The router's `navigate`, which first leaves the page shown when it goes to another page. The
 * router changes the address only once the next page is loaded: the address is the next page's
 * from the press, in an entry of the history that the router then takes over, and that a press
 * before then takes the place of.
 */
export function useSiteNavigate() {
  const navigate = useNavigate()
  const { pathname, key } = useLocation()
  const root = useHref('/')
  return (to: string, options?: NavigateOptions) => {
    const next = resolvePath(to, pathname)
    const path = normalize(next.pathname)
    const isPending = leaving?.key === key && leaving.isPushed
    if (path === normalize(pathname)) {
      // Back to this page from a press whose page has yet to load: its entry is taken over.
      leave()
      return navigate(to, isPending ? { ...options, replace: true } : options)
    }
    const href =
      (path === '/' ? root : root.replace(/\/$/, '') + next.pathname) + next.search + next.hash
    if (options?.replace || isPending) window.history.replaceState(null, '', href)
    else window.history.pushState(null, '', href)
    leave({ key, path, isPushed: true })
    navigate(to, { ...options, replace: true })
  }
}
