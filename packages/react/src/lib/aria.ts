import type { Ref } from 'react'
import { composeRenderProps } from 'react-aria-components'
import { twMerge } from './tv'

/* The components built on a React Aria component take its props and pass them through:
 * `className` as a function of the state it reports, `style`, `ref` and the rest. These are
 * what they add around that. */

// React Aria's prop types leave `ref` out, and its components take it as the element's own.
/** The `ref` of a React Aria component rendered as an `Element`, typed as that element's own. */
export type RefProps<Element> = { ref?: Ref<Element> }

/**
 * `Props` less those named, as `Omit` leaves them, for a React Aria prop a component takes
 * with a type of its own, or not at all. Mapped over the keys, so that a union of props stays
 * one.
 */
export type Except<Props, Names extends PropertyKey> = {
  [Name in keyof Props as Exclude<Name, Names>]: Props[Name]
}

/**
 * A React Aria `className` with a component's own classes before it, as React Aria's Tailwind
 * starter composes one: resolved against the state when given as a function, then merged with
 * this theme's tailwind-merge, so that the caller's class wins over one of the same utility.
 */
export function composeTailwindRenderProps<State>(
  className: string | ((state: State) => string) | undefined,
  tailwind: string,
): string | ((state: State) => string) {
  return composeRenderProps(className, (className) => twMerge(tailwind, className))
}

/**
 * A modal's React Aria `shouldCloseOnInteractOutside`, with the caller's after it: a press
 * outside a modal lands on its scrim, which covers the window, so one the browser gives the
 * document itself closes nothing. A browser does that wherever the pointer is while a view
 * transition starts, as a calendar's does as it pages.
 */
export function composeShouldCloseOnInteractOutside(
  shouldCloseOnInteractOutside?: (element: Element) => boolean,
): (element: Element) => boolean {
  return (element) =>
    element !== element.ownerDocument.documentElement &&
    (shouldCloseOnInteractOutside?.(element) ?? true)
}
