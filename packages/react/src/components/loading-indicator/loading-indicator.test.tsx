import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Label } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { LoadingIndicator } from './loading-indicator'

/* Markup and attributes that jsdom can check without a stylesheet. The sizes, the
 * colors and the motion need the real stylesheet, so they are checked in
 * loading-indicator.browser.test.tsx instead. */

describe('LoadingIndicator', () => {
  it('renders a progressbar named by its label', () => {
    render(<LoadingIndicator aria-label="Loading news article" />)
    const indicator = screen.getByRole('progressbar', { name: 'Loading news article' })
    expect(indicator.tagName).toBe('DIV')
  })

  it('has no value, which is what makes a progressbar indeterminate', () => {
    render(<LoadingIndicator aria-label="Refreshing page" />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator).not.toHaveAttribute('aria-valuenow')
    expect(indicator).not.toHaveAttribute('aria-valuetext')
  })

  it('keeps the range of a React Aria progress bar all the same', () => {
    render(<LoadingIndicator aria-label="Refreshing page" />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator).toHaveAttribute('aria-valuemin', '0')
    expect(indicator).toHaveAttribute('aria-valuemax', '100')
  })

  it('can be named by another element', () => {
    render(
      <>
        <span id="status">Loading my episodes</span>
        <LoadingIndicator aria-labelledby="status" />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Loading my episodes' })).toBeInTheDocument()
  })

  it('can be named by a React Aria Label among its children', () => {
    render(
      <LoadingIndicator>
        <Label>Loading news article</Label>
      </LoadingIndicator>,
    )
    expect(screen.getByRole('progressbar', { name: 'Loading news article' })).toBeInTheDocument()
  })

  it('can be hidden from assistive technology inside what already says so, by an element around it', () => {
    render(
      <button>
        <span aria-hidden>
          <LoadingIndicator aria-label="Saving" />
        </span>
        Saving
      </button>,
    )
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saving' })).toBeInTheDocument()
  })

  it('passes no aria-hidden of its own on, as React Aria leaves it out', () => {
    render(<LoadingIndicator aria-label="Saving" aria-hidden />)
    expect(screen.getByRole('progressbar', { name: 'Saving' })).not.toHaveAttribute('aria-hidden')
  })

  it('holds the active indicator and nothing else', () => {
    render(<LoadingIndicator aria-label="Loading" />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator.children).toHaveLength(1)
    expect(indicator.firstElementChild).toBeEmptyDOMElement()
  })

  it('draws its children after the active indicator', () => {
    render(
      <LoadingIndicator>
        <Label>Loading</Label>
      </LoadingIndicator>,
    )
    const indicator = screen.getByRole('progressbar')
    expect(indicator.children).toHaveLength(2)
    expect(indicator.firstElementChild).toBeEmptyDOMElement()
    expect(indicator.lastElementChild).toHaveTextContent('Loading')
  })

  it('calls children given as a function with the state React Aria reports, indeterminate', () => {
    render(
      <LoadingIndicator aria-label="Loading">
        {({ isIndeterminate, percentage, valueText }) => (
          <span data-testid="state">
            {JSON.stringify({ isIndeterminate, percentage, valueText })}
          </span>
        )}
      </LoadingIndicator>,
    )
    expect(JSON.parse(screen.getByTestId('state').textContent!)).toEqual({ isIndeterminate: true })
    expect(screen.getByRole('progressbar').firstElementChild).toBeEmptyDOMElement()
  })

  it('leaves the size to the stylesheet unless one is asked for', () => {
    render(<LoadingIndicator aria-label="Loading" />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator.style.getPropertyValue('--loading-indicator-size')).toBe('')
    expect(indicator).not.toHaveAttribute('style')
  })

  it('passes a size on as a number of dp', () => {
    render(<LoadingIndicator aria-label="Loading" size={96} />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator.style.getPropertyValue('--loading-indicator-size')).toBe('96')
  })

  it('keeps a style of the caller next to the size', () => {
    render(<LoadingIndicator aria-label="Loading" size={96} style={{ opacity: 0.5 }} />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator.style.getPropertyValue('--loading-indicator-size')).toBe('96')
    expect(indicator.style.opacity).toBe('0.5')
  })

  it('takes a style as a function of the state React Aria reports', () => {
    render(
      <LoadingIndicator
        aria-label="Loading"
        size={96}
        style={({ isIndeterminate }) => ({ opacity: isIndeterminate ? 0.5 : 1 })}
      />,
    )
    const indicator = screen.getByRole('progressbar')
    expect(indicator.style.getPropertyValue('--loading-indicator-size')).toBe('96')
    expect(indicator.style.opacity).toBe('0.5')
  })

  it('is on a container only when contained', () => {
    render(
      <>
        <LoadingIndicator aria-label="Default" />
        <LoadingIndicator aria-label="Contained" isContained />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Default' })).not.toHaveClass(
      'bg-primary-container',
    )
    expect(screen.getByRole('progressbar', { name: 'Contained' })).toHaveClass(
      'bg-primary-container',
    )
  })

  it('takes a color of the caller in place of its own', () => {
    render(<LoadingIndicator aria-label="Loading" className="text-on-primary" />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator).toHaveClass('text-on-primary')
    expect(indicator).not.toHaveClass('text-primary')
  })

  it('takes a className as a function of the state React Aria reports, and its default', () => {
    render(
      <LoadingIndicator
        aria-label="Loading"
        className={({ defaultClassName, isIndeterminate }) =>
          `${defaultClassName} ${isIndeterminate ? 'text-on-primary' : ''}`
        }
      />,
    )
    const indicator = screen.getByRole('progressbar')
    expect(indicator).toHaveClass('react-aria-ProgressBar', 'text-on-primary', 'loading-indicator')
    expect(indicator).not.toHaveClass('text-primary')
  })

  it('forwards a ref and other props to the progressbar', () => {
    const ref = createRef<HTMLDivElement>()
    render(<LoadingIndicator aria-label="Loading" ref={ref} data-testid="indicator" id="feed" />)
    expect(ref.current).toBe(screen.getByTestId('indicator'))
    expect(ref.current).toHaveAttribute('id', 'feed')
    expect(ref.current).toHaveAttribute('role', 'progressbar')
  })
})
