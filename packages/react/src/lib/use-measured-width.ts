import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/**
 * An element's border box width as laid out, to the fraction. A transform
 * leaves it alone, where a client rect inside a scaled element, as a dialog is
 * while it scales in, is scaled with it. Not laid out, or an inline box, an
 * element has no width in px, and this is 0.
 */
export function laidOutWidth(el: HTMLElement) {
  const style = getComputedStyle(el)
  if (!style.width.endsWith('px')) return 0
  const edges =
    style.boxSizing === 'border-box'
      ? []
      : [style.paddingLeft, style.paddingRight, style.borderLeftWidth, style.borderRightWidth]
  const width = edges.reduce((sum, edge) => sum + parseFloat(edge), parseFloat(style.width))
  // The style keeps six digits, and a width set a hair short loses a whole step of the 1/64px
  // Chromium and WebKit lay out on: rounded to that grid, it is the width to the step again.
  return Math.round(width * 64) / 64
}

/**
 * An element's width, `laidOutWidth` unless `measure` is given, measured again
 * whenever `key` (what its content depends on) changes, for the CSS variable a
 * transition runs to (`width: auto` can't).
 * `ref` goes on the element. It is a callback, so an element mounted later than
 * the component measuring it is measured once it is: React Aria draws an item's
 * content from the children it collected, after the component that gave them
 * has rendered. `animate` is false for the render a measurement lands in that
 * isn't such a change - the first, or a correction once laid out or a web font
 * has arrived - and for the frame after, so the caller can hold its transition
 * off and snap.
 */
export function useMeasuredWidth<Element extends HTMLElement>(
  key: unknown,
  measure: (el: Element) => number = laidOutWidth,
) {
  const elRef = useRef<Element | null>(null)
  // The element, once the ref is given it, which runs the measuring again. A ref callback new
  // each render, as `mergeRefs` makes one, gives the same element again: that changes nothing.
  const [attached, setAttached] = useState<Element | null>(null)
  const ref = useCallback((node: Element | null) => {
    elRef.current = node
    if (node) setAttached(node)
  }, [])
  const [state, setState] = useState<{ width?: number; animate: boolean }>({ animate: true })

  useLayoutEffect(() => {
    const el = elRef.current
    if (!el) return
    const width = measure(el)
    setState((prev) => (prev.width === width ? prev : { width, animate: prev.width !== undefined }))
  }, [attached, key, measure])

  // Mounted under `display: none`, or before a web font has loaded, that
  // measured too little; this reports the real size once laid out.
  useLayoutEffect(() => {
    const el = elRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const width = measure(el)
      setState((prev) => (prev.width === width ? prev : { width, animate: false }))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [attached, measure])

  // Puts the transition back a frame after a snap. The forced layout first
  // makes the snapped width the resting style, so turning it on starts nothing.
  useLayoutEffect(() => {
    if (state.animate) return
    elRef.current?.getBoundingClientRect()
    const frame = requestAnimationFrame(() => setState((prev) => ({ ...prev, animate: true })))
    return () => cancelAnimationFrame(frame)
  }, [state.animate])

  return { ref, ...state }
}
