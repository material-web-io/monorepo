import { fireEvent, render } from '@testing-library/react'
import type { CSSProperties } from 'react'
import { describe, expect, it } from 'vitest'
import { computedStyleOf } from '../../test-browser'
import { Ripple, type RippleProps } from './ripple'

/*
 * The pressed circle's opacity and color need the real stylesheet: jsdom never
 * resolves the `opacity-state-pressed` token or `currentColor`. The rest of
 * Ripple's behavior is checked in ripple.test.tsx.
 */

const surfaceOf = (host: HTMLElement) => host.children[1] as HTMLElement

describe('Ripple in a browser', () => {
  it('draws the pressed circle at the state-layer opacity, in the host text color', () => {
    const { getByRole } = render(
      <button style={{ color: 'rgb(10, 20, 30)' }}>
        <Ripple />
      </button>,
    )
    const host = getByRole('button')
    fireEvent.pointerDown(host, { button: 0, clientX: 4, clientY: 4 })
    const circle = surfaceOf(host).firstElementChild!
    const style = getComputedStyle(circle)
    expect(style.opacity).toBe(computedStyleOf('opacity-state-pressed', (s) => s.opacity))
    expect(style.backgroundColor).toBe(getComputedStyle(host).color)
  })

  it('fades a cancelled press at once, and keeps one let go of until it is half grown', async () => {
    const { getByRole } = render(
      <button>
        <Ripple />
      </button>,
    )
    const host = getByRole('button')
    const fading = (circle: Element) =>
      circle
        .getAnimations()
        .some((it) =>
          (it.effect as KeyframeEffect).getKeyframes().some((key) => key.opacity === '0'),
        )
    const later = () => new Promise((done) => setTimeout(done, 20))
    // A scroll, or a bottom sheet's drag, takes the pointer: pointercancel.
    fireEvent.pointerDown(host, { button: 0, clientX: 4, clientY: 4 })
    const cancelled = surfaceOf(host).lastElementChild!
    fireEvent.pointerCancel(host)
    await later()
    expect(fading(cancelled)).toBe(true)
    fireEvent.pointerDown(host, { button: 0, clientX: 4, clientY: 4 })
    const tapped = surfaceOf(host).lastElementChild!
    fireEvent.pointerUp(host)
    await later()
    expect(fading(tapped)).toBe(false)
  })

  it('grows over the long-1 duration in seconds too, as a minifier rewrites the token', () => {
    const { getByRole } = render(
      <button style={{ '--md-sys-motion-duration-long1': '.45s' } as CSSProperties}>
        <Ripple />
      </button>,
    )
    const host = getByRole('button')
    fireEvent.pointerDown(host, { button: 0, clientX: 4, clientY: 4 })
    const [grow] = surfaceOf(host).firstElementChild!.getAnimations()
    expect(grow!.effect!.getTiming().duration).toBe(450)
  })

  it('draws the pressed circle in the color role the variant names instead', () => {
    const { getByRole } = render(
      <button style={{ color: 'rgb(10, 20, 30)' }}>
        <Ripple variant="primary" />
      </button>,
    )
    const host = getByRole('button')
    fireEvent.pointerDown(host, { button: 0, clientX: 4, clientY: 4 })
    const circle = surfaceOf(host).firstElementChild!
    const primary = computedStyleOf('text-primary', (s) => s.color)
    expect(primary).not.toBe(getComputedStyle(host).color)
    expect(getComputedStyle(circle).backgroundColor).toBe(primary)
  })

  it('shows the state layer at the states it is given, inside a part that takes no pointer', () => {
    // Mounted with each state rather than moved to it: the layer fades between states.
    const layerWith = (props: Pick<RippleProps, 'isHovered' | 'isFocusVisible' | 'isDisabled'>) => {
      const { container } = render(
        <button>
          <span style={{ pointerEvents: 'none' }}>
            <Ripple {...props} />
          </span>
        </button>,
      )
      return getComputedStyle(container.querySelector('.state-layer')!).opacity
    }
    const opacity = (className: string) => computedStyleOf(className, (s) => s.opacity)
    expect(layerWith({ isHovered: true })).toBe(opacity('opacity-state-hover'))
    expect(layerWith({ isHovered: true, isFocusVisible: true })).toBe(
      opacity('opacity-state-focus'),
    )
    expect(layerWith({ isHovered: true, isFocusVisible: true, isDisabled: true })).toBe('0')
  })
})
