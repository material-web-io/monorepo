import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { DEFAULT_SLOT } from 'react-aria-components'
import { describe, expect, it, vi } from 'vitest'
import { Icon, IconContext } from './icon'

describe('Icon', () => {
  it('renders the ligature name as text', () => {
    const { container } = render(<Icon name="home" />)
    expect(container.firstElementChild).toHaveTextContent('home')
  })

  it('is hidden from assistive technology by default', () => {
    const { container } = render(<Icon name="home" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('is exposed as an image when labelled', () => {
    render(<Icon name="home" aria-label="Home" />)
    const icon = screen.getByRole('img', { name: 'Home' })
    expect(icon).not.toHaveAttribute('aria-hidden')
  })

  it('is styled by its classes alone, with no style of its own', () => {
    render(<Icon name="home" className="icon-filled" />)
    const icon = screen.getByText('home')
    expect(icon).toHaveClass('font-icon', 'icon-filled')
    expect(icon).not.toHaveAttribute('style')
  })

  it('forwards the ref, a custom class and other props', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Icon name="home" ref={ref} slot="leading" className="text-primary" data-testid="i" />)
    expect(ref.current).toBe(screen.getByTestId('i'))
    expect(ref.current).toHaveAttribute('slot', 'leading')
    expect(ref.current).toHaveClass('text-primary')
  })

  it('checks its slot against the slots of an IconContext, as React Aria does, and none without one', () => {
    const slots = { slots: { [DEFAULT_SLOT]: {}, leading: {} } }
    render(
      <IconContext.Provider value={slots}>
        <Icon name="star" slot="leading" />
        <Icon name="add" />
      </IconContext.Provider>,
    )
    expect(screen.getByText('star')).toHaveAttribute('slot', 'leading')
    expect(screen.getByText('add')).not.toHaveAttribute('slot')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      render(
        <IconContext.Provider value={slots}>
          <Icon name="close" slot="leadng" />
        </IconContext.Provider>,
      ),
    ).toThrow('Invalid slot "leadng".')
    error.mockRestore()
    render(<Icon name="home" slot="anything" />)
    expect(screen.getByText('home')).toHaveAttribute('slot', 'anything')
  })

  it('takes nothing from its context but the check', () => {
    // Its type allows no props; given some all the same, they are not drawn.
    const slots = { slots: { leading: { title: 'From the context' } } } as never
    render(
      <IconContext.Provider value={slots}>
        <Icon name="star" slot="leading" />
      </IconContext.Provider>,
    )
    expect(screen.getByText('star')).not.toHaveAttribute('title')
  })
})
