import { fireEvent, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Ripple } from './ripple'

// The ripple layer is the second child of the host: [state layer, ripple surface].
const surfaceOf = (host: HTMLElement) => host.children[1] as HTMLElement

describe('Ripple', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders a state layer and a ripple surface, both hidden from assistive technology', () => {
    const { getByRole } = render(
      <button>
        <Ripple />
      </button>,
    )
    const host = getByRole('button')
    expect(host.children).toHaveLength(2)
    expect(host.querySelector('.state-layer')).toBe(host.children[0])
    for (const child of host.children) expect(child).toHaveAttribute('aria-hidden', 'true')
  })

  it('draws a circle on press and removes it after release', () => {
    const { getByRole } = render(
      <button>
        <Ripple />
      </button>,
    )
    const host = getByRole('button')
    fireEvent.pointerDown(host, { button: 0, clientX: 4, clientY: 4 })
    expect(surfaceOf(host).children).toHaveLength(1)

    fireEvent.pointerUp(host)
    vi.runAllTimers()
    expect(surfaceOf(host).children).toHaveLength(0)
  })

  it('ignores presses on a disabled host and non-primary buttons', () => {
    const { getByRole, rerender } = render(
      <button disabled>
        <Ripple />
      </button>,
    )
    fireEvent.pointerDown(getByRole('button'), { button: 0 })
    expect(surfaceOf(getByRole('button')).children).toHaveLength(0)

    rerender(
      <button>
        <Ripple />
      </button>,
    )
    fireEvent.pointerDown(getByRole('button'), { button: 2 })
    expect(surfaceOf(getByRole('button')).children).toHaveLength(0)
  })

  it('stops listening when unmounted', () => {
    const { getByRole, unmount } = render(
      <button>
        <Ripple />
      </button>,
    )
    const host = getByRole('button')
    const surface = surfaceOf(host)
    unmount()
    fireEvent.pointerDown(host, { button: 0 })
    expect(surface.children).toHaveLength(0)
  })
})
