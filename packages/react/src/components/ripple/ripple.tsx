import { useEffect, useRef } from 'react'
import { ms } from '../../lib/motion'
import { tv, type VariantProps } from '../../lib/tv'

/* The state layer and pressed ripple of a positioned interactive element, both
 * drawn in the parent's text color: <button className="relative ..."><Ripple />.
 * Hover/focus are CSS (state-layer); press is a circle grown from the pointer. */
const ripple = 'absolute rounded-full bg-current opacity-state-pressed'

/* The state layer, which shows on its parent's hover and focus, or on the states it is given,
 * and the surface the press circle grows in, clipped to the host's corners. The surface's text
 * color is the circle's: the host's own unless the variant names another color role. */
const parts = tv({
  slots: {
    layer: 'state-layer',
    surface: 'pointer-events-none absolute inset-0 overflow-hidden rounded-inherit',
  },
  variants: {
    variant: {
      default: {},
      primary: { surface: 'text-primary' },
      error: { surface: 'text-error' },
      'on-surface': { surface: 'text-on-surface' },
      'on-surface-variant': { surface: 'text-on-surface-variant' },
      'on-secondary-container': { surface: 'text-on-secondary-container' },
    },
  },
  defaultVariants: { variant: 'default' },
})

export type RippleProps = {
  /**
   * `default` draws both the hover and focus layer and the press circle in the host's text
   * color. A color role (`primary`, `error`, `on-surface`, ...) is the press circle's instead,
   * when it differs from the layer's.
   */
  variant?: VariantProps<typeof parts>['variant']
  /**
   * The host's states, for a state layer in a part of the host (a switch's halo, a checkbox's
   * round host in its label), which cannot see them: a React Aria component's render props. They
   * outweigh the part's own states. Left out, the layer shows its parent's.
   */
  isHovered?: boolean
  isFocusVisible?: boolean
  isDisabled?: boolean
}

/** The interactive element a ripple is drawn in: its parent, past any part that takes no pointer (a switch's halo), which hears no press. */
const hostOf = (layer: HTMLElement) => {
  let host = layer.parentElement
  while (host && getComputedStyle(host).pointerEvents === 'none') host = host.parentElement
  return host
}

// The presses a ripple has taken: one on a control inside another that ripples too (a
// chip's remove button) is the inner one's, which hears it first, and not the outer's as well.
const taken = new WeakSet<PointerEvent>()

export function Ripple({ variant, isHovered, isFocusVisible, isDisabled }: RippleProps = {}) {
  const clip = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const layer = clip.current
    const host = layer && hostOf(layer)
    if (!layer || !host) return

    const onPointerDown = (event: PointerEvent) => {
      if (taken.has(event)) return
      taken.add(event)
      // Disabled as the disabled: variant has it, or by aria-disabled, on the host or around
      // it (a switch's label, which its host cannot see).
      if (event.button !== 0 || layer.closest(':disabled, [data-disabled], [aria-disabled="true"]'))
        return

      const tokens = getComputedStyle(host)
      const token = (name: string) => tokens.getPropertyValue(name).trim()
      // Motion tokens, so prefers-reduced-motion makes the ripple instant. It
      // stays at least half its growth time, so a quick tap still shows it.
      const grow = ms(token('--md-sys-motion-duration-long1'))
      const fade = ms(token('--md-sys-motion-duration-short4'))

      const circle = document.createElement('span')
      circle.className = ripple
      layer.append(circle)

      // The host can resize while pressed (e.g. a button-group item growing
      // wider), so track it and keep the circle covering the farthest corner
      // from the pointer instead of freezing geometry from the initial rect.
      // The surface's own box: the host's, or the positioned ancestor's that a
      // static host (a list item's action) lets the surface fill.
      const place = () => {
        const rect = layer.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y))
        circle.style.left = `${x - radius}px`
        circle.style.top = `${y - radius}px`
        circle.style.width = circle.style.height = `${2 * radius}px`
      }
      place()
      const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(place)
      resize?.observe(host)

      const start = performance.now()
      circle.animate?.([{ transform: 'scale(0.3)' }, { transform: 'scale(1)' }], {
        duration: grow,
        easing: token('--md-sys-motion-easing-standard'),
        fill: 'forwards',
      })

      // A press let go of fades once the circle is half grown; one cancelled, as a scroll or a
      // sheet's drag taking the pointer cancels it, fades at once. Heard on the document, as
      // React Aria hears a press end: where the pointer is let go, in `host` or out of it.
      const page = host.ownerDocument
      const release = (end: Event) => {
        if (end instanceof PointerEvent && end.pointerId !== event.pointerId) return
        page.removeEventListener('pointerup', release)
        page.removeEventListener('pointercancel', release)
        const held = end.type === 'pointercancel' ? 0 : grow / 2
        const wait = Math.max(0, held - (performance.now() - start))
        setTimeout(() => {
          resize?.disconnect()
          const fadeOut = circle.animate?.({ opacity: 0 }, { duration: fade, fill: 'forwards' })
          if (fadeOut) fadeOut.onfinish = () => circle.remove()
          else circle.remove()
        }, wait)
      }
      page.addEventListener('pointerup', release)
      page.addEventListener('pointercancel', release)
    }

    host.addEventListener('pointerdown', onPointerDown)
    return () => host.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const { layer, surface } = parts({ variant })
  // The states it is given, as React Aria's render props are styled: focus over hover, none
  // disabled. Opacity classes, which outweigh the states its parent has of its own (ripple.css).
  const given = isDisabled
    ? 'opacity-0'
    : isFocusVisible
      ? 'opacity-state-focus'
      : isHovered
        ? 'opacity-state-hover'
        : ''
  return (
    <>
      <span aria-hidden className={layer({ className: given })} />
      <span ref={clip} aria-hidden className={surface()} />
    </>
  )
}
