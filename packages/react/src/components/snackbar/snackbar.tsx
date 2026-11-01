import {
  useContext,
  useEffect,
  useLayoutEffect,
  type ComponentProps,
  type CSSProperties,
  type ElementType,
} from 'react'
import { flushSync } from 'react-dom'
import { useObjectRef } from 'react-aria'
import {
  composeRenderProps,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as AriaToastContent,
  UNSTABLE_ToastQueue as AriaToastQueue,
  UNSTABLE_ToastRegion as AriaToastRegion,
  UNSTABLE_ToastStateContext as ToastStateContext,
  type ToastProps as AriaToastProps,
  type ToastRegionProps as AriaToastRegionProps,
  type ToastRegionRenderProps,
  type ToastRenderProps,
} from 'react-aria-components'
import { composeTailwindRenderProps, type RefProps } from '../../lib/aria'
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from '../../lib/button'
import { twMerge } from '../../lib/tv'
import { Ripple } from '../ripple'

/* React Aria's toasts as M3 snackbars: its ToastQueue, one shown at a time; its ToastRegion, at the
 * window's bottom; its Toast, the container; its ToastContent, their live text; and its Buttons,
 * their action and close button. The fixed classes and the motion are in snackbar.css. */

// What a Snackbar passes its className, style and children, given as functions: the toast it
// draws, and whether it is focused, by keyboard or not.
export type SnackbarRenderProps<T> = ToastRenderProps<T>

// What a SnackbarRegion passes its className and style, given as functions: the snackbars shown,
// and whether it is hovered or focused, by keyboard or not.
export type SnackbarRegionRenderProps<T> = ToastRegionRenderProps<T>

// What a SnackbarQueue shows and hides, in a view transition of the type snackbar, which fades out
// the one hidden (snackbar.css), where the browser has them typed and motion is not reduced.
function transition(update: () => void) {
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document) ||
    !CSS.supports('selector(:active-view-transition-type(snackbar))') ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return update()
  }
  document.startViewTransition({ update: () => flushSync(update), types: ['snackbar'] })
}

// The options of React Aria's ToastQueue: `maxVisibleToasts`, 1 unless given, and `wrapUpdate`,
// the view transition the snackbars come and go in unless given.
export type SnackbarQueueOptions = NonNullable<ConstructorParameters<typeof AriaToastQueue>[0]>

// React Aria's ToastQueue, which holds the snackbars: `add(content, options)` shows one, newest
// first, with a `timeout` in ms to close it after and an `onClose`, and gives its key, and
// `close(key)` closes it. One shows at a time: one added meanwhile takes its place, which comes
// back once that one has closed. Each grows up from its bottom edge as it shows, and fades out.
/**
 * Only one snackbar may be displayed at a time.
 *
 * Consecutive snackbars must appear one at a time.
 *
 * Snackbars without actions appear and disappear automatically, while those with actions remain
 * on screen until dismissed. However, a snackbar with updated information can immediately replace
 * an outdated snackbar.
 *
 * Snackbars without actions can auto-dismiss after 4–10 seconds, depending on platform. Avoid
 * using auto-dismissing snackbars on web unless there's also inline feedback.
 *
 * Snackbars with actions should remain on the screen until the user takes an action on the
 * snackbar, or dismisses it.
 *
 * Snackbars appear without warning, but they don’t block users from interacting with page
 * content.
 *
 * @see https://m3.material.io/components/snackbar/guidelines
 * @see https://m3.material.io/components/snackbar/accessibility
 */
export class SnackbarQueue<T> extends AriaToastQueue<T> {
  constructor(options?: SnackbarQueueOptions) {
    super({ maxVisibleToasts: 1, wrapUpdate: transition, ...options })
  }
}

// The props of React Aria's ToastRegion, with the `ref` of its <div>: its `queue`, and as
// children a function of each toast it shows, which returns its Snackbar.
export type SnackbarRegionProps<T> = AriaToastRegionProps<T> & RefProps<HTMLDivElement>

// React Aria's ToastRegion, a landmark at the end of the page while it shows a snackbar, which F6
// moves the focus to: the snackbars at the bottom of the window, centered, 12dp from its edges and
// up to 600dp wide, as Compose places them. Move it with `className`, as above a FAB.
/**
 * Snackbars should be placed at the bottom of a UI, in front of the main content. In some cases,
 * snackbars can be nudged upwards to avoid overlapping with other UI elements near the bottom,
 * such as FABs or docked toolbars.
 *
 * Avoid placing a snackbar in front of frequently used touch targets or navigation.
 *
 * Snackbars should appear above FABs.
 *
 * In compact breakpoints, snackbars should expand vertically from 48dp to 64dp to accommodate one
 * or two lines of text, while maintaining a fixed distance from the leading, trailing, and bottom
 * edges of the screen.
 *
 * In wider layouts, snackbars can be left-aligned or center-aligned if they are consistently
 * placed on the same spot at the bottom of the screen.
 *
 * On web, a shortcut should exist for users to move focus to snackbars with actions (like Alt+G).
 * Ensure that this shortcut is clearly documented, like in a help article.
 *
 * @see https://m3.material.io/components/snackbar/guidelines
 * @see https://m3.material.io/components/snackbar/accessibility
 */
export function SnackbarRegion<T>({ className, ...props }: SnackbarRegionProps<T>) {
  return (
    <AriaToastRegion
      {...props}
      className={composeTailwindRenderProps(className, 'snackbar-region')}
    />
  )
}

// The props of React Aria's Toast, with the `ref` of its <div>: the `toast` it draws, from its
// SnackbarRegion, and its children.
export type SnackbarProps<T> = AriaToastProps<T> & RefProps<HTMLDivElement>

// React Aria's Toast, an `alertdialog` the focus is not moved to, named by the React Aria `Text`
// in its SnackbarContent with `slot="title"`. After that come its SnackbarAction and its
// SnackbarCloseButton, which an action too long for the row (over 128dp, with the close button)
// takes below the text. Escape closes it while it has the focus, which React Aria's Toast does not.
/**
 * Snackbars show short updates about app processes at the bottom of the screen
 *
 * Snackbars inform users of a process that an app has performed or will perform. They appear
 * temporarily, towards the bottom of the screen.
 *
 * They shouldn't interrupt the user experience. People can browse the page content without being
 * required to interact with the snackbar.
 *
 * A snackbar can contain a single action. "Dismiss" or "cancel" actions are optional.
 *
 * Don't trap focus in the snackbar. Users should be able to freely navigate in and out.
 *
 * Keyboard navigation:
 * - Tab: Moves focus between interactive elements
 * - Esc: Dismisses the snackbar when in focus
 *
 * @see https://m3.material.io/components/snackbar/overview
 * @see https://m3.material.io/components/snackbar/guidelines
 * @see https://m3.material.io/components/snackbar/specs
 * @see https://m3.material.io/components/snackbar/accessibility
 */
export function Snackbar<T>({ className, style, ref, ...props }: SnackbarProps<T>) {
  const state = useContext(ToastStateContext)
  const toastRef = useObjectRef(ref)
  const { key } = props.toast
  // Its height at rest, which it grows to as it shows (snackbar.css), read before it is first drawn
  // with its animation off.
  useLayoutEffect(() => {
    const toast = toastRef.current
    if (!toast) return
    const { animationName } = toast.style
    toast.style.animationName = 'none'
    toast.style.setProperty('--snackbar-height', getComputedStyle(toast).height)
    toast.style.animationName = animationName
  }, [toastRef])
  // Escape, which React Aria's Toast neither handles nor lets through to its props.
  useEffect(() => {
    const toast = toastRef.current
    if (!toast || !state) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      state.close(key)
    }
    toast.addEventListener('keydown', onKeyDown)
    return () => toast.removeEventListener('keydown', onKeyDown)
  }, [toastRef, state, key])
  return (
    <AriaToast
      {...props}
      ref={toastRef}
      // Its key, which names it in the view transitions it comes and goes in (snackbar.css), as
      // React Aria names its toasts.
      style={composeRenderProps(
        style,
        (style) => ({ '--snackbar-key': key, ...style }) as CSSProperties,
      )}
      className={composeTailwindRenderProps(className, 'snackbar')}
    />
  )
}

// The props of React Aria's ToastContent, a <div> with its `ref`.
export type SnackbarContentProps = ComponentProps<typeof AriaToastContent>

// React Aria's ToastContent, the snackbar's text, in the `alert` role, which is announced as the
// snackbar appears: its React Aria `Text` with `slot="title"` names the snackbar, and one with
// `slot="description"` describes it. Body medium, on as many lines as it takes.
/**
 * Snackbars contain a text label that directly relates to the process being performed. In
 * compact breakpoints, the text label can contain up to two lines of text.
 *
 * Keep the snackbar text label to one line long when possible
 *
 * When a snackbar appears, announce the message but don't move focus.
 *
 * @see https://m3.material.io/components/snackbar/guidelines
 * @see https://m3.material.io/components/snackbar/accessibility
 */
export function SnackbarContent({ className, ...props }: SnackbarContentProps) {
  return <AriaToastContent {...props} className={twMerge('snackbar-content', className)} />
}

// The props of React Aria's Button, from its hooks on the element given as `elementType`
// (lib/button), with the `ref` of that element.
export type SnackbarActionProps<T extends ElementType = 'button'> = AriaButtonProps<T>

// React Aria's Button, as `Button` is, drawn as the snackbar's own text button: 40dp and round, its
// label label large in inverse-primary, 12dp from its sides, with its state layers and ripple in
// that color. Its `onPress` is yours, which closes the snackbar with the queue's `close`.
/**
 * Snackbars can display a single text button that lets users take action on a process performed
 * by the app. Snackbars shouldn’t be the only way to access a core use case, to make an app
 * usable.
 *
 * To distinguish the action from the text label, text buttons should display colored text
 *
 * If an action is long, it can be displayed on a third line
 *
 * To allow users to amend choices, display an "Undo" action
 *
 * Snackbars with actions should remain on the screen until the user takes an action on the
 * snackbar, or dismisses it.
 *
 * @see https://m3.material.io/components/snackbar/guidelines
 * @see https://m3.material.io/components/snackbar/specs
 */
export function SnackbarAction<T extends ElementType = 'button'>({
  className,
  children,
  ...props
}: SnackbarActionProps<T>) {
  return (
    <AriaButton
      {...(props as AriaButtonProps<T>)}
      className={composeTailwindRenderProps(className, 'snackbar-action')}
    >
      {composeRenderProps(children, (children) => (
        <>
          <Ripple />
          {children}
        </>
      ))}
    </AriaButton>
  )
}

// The props of React Aria's Button, as a SnackbarAction's.
export type SnackbarCloseButtonProps<T extends ElementType = 'button'> = AriaButtonProps<T>

// React Aria's Button in the Toast's `close` slot, which names it Close, in React Aria's locale
// unless given an `aria-label`, and closes the snackbar: the snackbar's own icon button, 40dp and
// round, its 24dp icon, its child, in inverse-on-surface, as are its state layers and ripple.
/**
 * A snackbar can contain a single action. "Dismiss" or "cancel" actions are optional.
 *
 * Snackbars with actions should remain on the screen until the user takes an action on the
 * snackbar, or dismisses it.
 *
 * @see https://m3.material.io/components/snackbar/guidelines
 * @see https://m3.material.io/components/snackbar/specs
 */
export function SnackbarCloseButton<T extends ElementType = 'button'>({
  className,
  children,
  ...props
}: SnackbarCloseButtonProps<T>) {
  return (
    <AriaButton
      slot="close"
      {...(props as AriaButtonProps<T>)}
      className={composeTailwindRenderProps(className, 'snackbar-close-button')}
    >
      {composeRenderProps(children, (children) => (
        <>
          <Ripple />
          {children}
        </>
      ))}
    </AriaButton>
  )
}
