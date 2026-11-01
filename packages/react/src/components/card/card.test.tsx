import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '../button'
import { Card } from './card'

/* Markup and behavior that jsdom can check without a stylesheet: what the card renders as,
 * its role, the tab stops in it and its props. What it looks like: card.browser.test.tsx. */

const button = (name: string) => screen.getByRole('button', { name })

describe('Card', () => {
  it('is a <div> with no role and no tab stop, holding its children as given', () => {
    render(
      <Card data-testid="card">
        <h2>Headline</h2>
        <p>Supporting text</p>
      </Card>,
    )
    const card = screen.getByTestId('card')
    expect(card.tagName).toBe('DIV')
    expect(card).not.toHaveAttribute('role')
    expect(card).not.toHaveAttribute('tabindex')
    expect(card.children).toHaveLength(2)
    expect(card.firstElementChild).toBe(screen.getByRole('heading', { name: 'Headline' }))
    expect(card.lastElementChild).toBe(screen.getByText('Supporting text'))
  })

  it('leaves the actions in it to their own buttons, each a tab stop', async () => {
    const open = vi.fn()
    render(
      <Card>
        <p>Supporting text</p>
        <Button onPress={open}>Open</Button>
        <Button variant="text">Dismiss</Button>
      </Card>,
    )
    await userEvent.tab()
    expect(button('Open')).toHaveFocus()
    await userEvent.tab()
    expect(button('Dismiss')).toHaveFocus()
    await userEvent.click(button('Open'))
    expect(open).toHaveBeenCalledOnce()
  })

  it('passes its props, className and ref to its <div>', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Card ref={ref} id="album" className="w-80" aria-label="Album" />)
    expect(ref.current).toBe(screen.getByLabelText('Album'))
    expect(ref.current).toHaveAttribute('id', 'album')
    expect(ref.current).toHaveClass('w-80')
  })

  it('types a card as a <div> with no state of its own', () => {
    expect(() => (
      <>
        {/* @ts-expect-error a card cannot be disabled: the buttons in it can */}
        <Card disabled>Open</Card>
        {/* @ts-expect-error a card's className is a string: it reports no state */}
        <Card className={() => 'on'}>Open</Card>
      </>
    )).not.toThrow()
  })
})
