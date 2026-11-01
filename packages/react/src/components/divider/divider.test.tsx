import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { Divider } from './divider'

/* Markup and attributes that jsdom can check without a stylesheet. The line
 * itself (thickness, color, insets, how it fills a container) needs the real
 * stylesheet, so it is checked in divider.browser.test.tsx instead. */

describe('Divider', () => {
  it("is React Aria's Separator, an <hr> in the separator role", () => {
    render(<Divider />)
    const divider = screen.getByRole('separator')
    expect(divider.tagName).toBe('HR')
    expect(divider).toHaveAttribute('role', 'separator')
  })

  it('is horizontal by default, which needs no orientation attribute', () => {
    render(<Divider />)
    expect(screen.getByRole('separator')).not.toHaveAttribute('aria-orientation')
  })

  it('is a <div> when vertical, as React Aria draws one, and says so', () => {
    render(<Divider orientation="vertical" />)
    const divider = screen.getByRole('separator')
    expect(divider.tagName).toBe('DIV')
    expect(divider).toHaveAttribute('aria-orientation', 'vertical')
  })

  it('is drawn as the element given as elementType', () => {
    render(
      <ul>
        <li>One</li>
        <Divider elementType="li" />
        <li>Two</li>
      </ul>,
    )
    expect(screen.getByRole('separator').tagName).toBe('LI')
  })

  it('is named by aria-label', () => {
    render(<Divider aria-label="Older messages" />)
    expect(screen.getByRole('separator', { name: 'Older messages' })).toBeInTheDocument()
  })

  it('gives the element to the ref', () => {
    const ref = createRef<HTMLElement>()
    render(<Divider ref={ref} />)
    expect(ref.current).toBe(screen.getByRole('separator'))
  })

  it('takes a class of the caller and other props', () => {
    render(<Divider className="my-space-100" id="d" data-testid="d" />)
    const divider = screen.getByTestId('d')
    expect(divider).toHaveClass('my-space-100')
    expect(divider).toHaveAttribute('id', 'd')
  })
})
