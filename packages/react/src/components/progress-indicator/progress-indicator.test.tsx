import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { Label } from 'react-aria-components'
import { describe, expect, it } from 'vitest'
import { CircularProgressIndicator } from './circular-progress-indicator'
import { LinearProgressIndicator } from './linear-progress-indicator'

/* Markup and attributes that jsdom can check without a stylesheet or the Web Animations
 * API. The sizes, the colors, the outlines and the motion need the real stylesheet and a
 * real browser, so they are checked in progress-indicator.browser.test.tsx instead. */

describe('LinearProgressIndicator and CircularProgressIndicator', () => {
  it('renders a progressbar named by its label', () => {
    render(<LinearProgressIndicator aria-label="Loading news article" value={40} />)
    const indicator = screen.getByRole('progressbar', { name: 'Loading news article' })
    expect(indicator.tagName).toBe('DIV')
  })

  it('reports a determinate value from 0 to 100, as React Aria does', () => {
    render(<LinearProgressIndicator aria-label="Loading" value={40} />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator).toHaveAttribute('aria-valuemin', '0')
    expect(indicator).toHaveAttribute('aria-valuemax', '100')
    expect(indicator).toHaveAttribute('aria-valuenow', '40')
    expect(indicator).toHaveAttribute('aria-valuetext', '40%')
  })

  it('keeps a value within its range', () => {
    render(
      <>
        <LinearProgressIndicator aria-label="Too much" value={150} />
        <LinearProgressIndicator aria-label="Too little" value={-1} />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Too much' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
    expect(screen.getByRole('progressbar', { name: 'Too little' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    )
  })

  it('reports a value on a range and with a text of its own', () => {
    render(
      <>
        <LinearProgressIndicator aria-label="Episodes" value={3} maxValue={4} valueLabel="3 of 4" />
        <CircularProgressIndicator
          aria-label="Download"
          value={12}
          minValue={10}
          maxValue={20}
          formatOptions={{ style: 'unit', unit: 'megabyte' }}
        />
      </>,
    )
    const episodes = screen.getByRole('progressbar', { name: 'Episodes' })
    expect(episodes).toHaveAttribute('aria-valuenow', '3')
    expect(episodes).toHaveAttribute('aria-valuemax', '4')
    expect(episodes).toHaveAttribute('aria-valuetext', '3 of 4')
    const download = screen.getByRole('progressbar', { name: 'Download' })
    expect(download).toHaveAttribute('aria-valuemin', '10')
    expect(download).toHaveAttribute('aria-valuetext', '12 MB')
  })

  it('has no value when indeterminate, though React Aria keeps its range', () => {
    render(<LinearProgressIndicator aria-label="Refreshing page" isIndeterminate value={40} />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator).not.toHaveAttribute('aria-valuenow')
    expect(indicator).not.toHaveAttribute('aria-valuetext')
    expect(indicator).toHaveAttribute('aria-valuemin', '0')
    expect(indicator).toHaveAttribute('aria-valuemax', '100')
  })

  it('can be named by another element', () => {
    render(
      <>
        <span id="status">Loading my episodes</span>
        <LinearProgressIndicator aria-labelledby="status" isIndeterminate />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Loading my episodes' })).toBeInTheDocument()
  })

  it('can be named by a Label among its children, drawn after its parts', () => {
    render(
      <>
        <LinearProgressIndicator value={40}>
          <Label>Loading news article</Label>
        </LinearProgressIndicator>
        <CircularProgressIndicator value={40}>
          <Label>Refreshing page</Label>
        </CircularProgressIndicator>
      </>,
    )
    const linear = screen.getByRole('progressbar', { name: 'Loading news article' })
    expect(linear.children).toHaveLength(4)
    expect(linear.lastElementChild).toHaveTextContent('Loading news article')
    const circular = screen.getByRole('progressbar', { name: 'Refreshing page' })
    expect(circular.children).toHaveLength(2)
    expect(circular.lastElementChild).toHaveTextContent('Refreshing page')
  })

  it('gives its children as a function the percentage, the value text and whether it is indeterminate', () => {
    render(
      <>
        <LinearProgressIndicator aria-label="Loading" value={40}>
          {({ percentage, valueText, isIndeterminate }) => (
            <span>{`${percentage} ${valueText} ${isIndeterminate}`}</span>
          )}
        </LinearProgressIndicator>
        <CircularProgressIndicator aria-label="Working" isIndeterminate>
          {({ percentage, isIndeterminate }) => <span>{`${percentage} ${isIndeterminate}`}</span>}
        </CircularProgressIndicator>
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toHaveTextContent('40 40% false')
    expect(screen.getByRole('progressbar', { name: 'Working' })).toHaveTextContent('undefined true')
  })

  it('is hidden from assistive technology inside what is hidden, as in a button whose label says so', () => {
    render(
      <button>
        <span aria-hidden>
          <CircularProgressIndicator aria-label="Saving" isIndeterminate />
        </span>
        Saving
      </button>,
    )
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saving' })).toBeInTheDocument()
  })

  it('passes no aria-hidden of its own on, as React Aria leaves it out', () => {
    render(<CircularProgressIndicator aria-label="Saving" aria-hidden isIndeterminate />)
    expect(screen.getByRole('progressbar', { name: 'Saving' })).not.toHaveAttribute('aria-hidden')
  })

  it('holds a track, an active indicator and a stop indicator when determinate', () => {
    render(<LinearProgressIndicator aria-label="Loading" value={40} />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator.children).toHaveLength(3)
    for (const part of indicator.children) expect(part).toBeEmptyDOMElement()
  })

  it('has no stop indicator when indeterminate, circular, or told not to', () => {
    render(
      <>
        <LinearProgressIndicator aria-label="Indeterminate" isIndeterminate />
        <CircularProgressIndicator aria-label="Circular" value={40} />
        <LinearProgressIndicator aria-label="Without" value={40} showStopIndicator={false} />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Indeterminate' }).children).toHaveLength(2)
    expect(screen.getByRole('progressbar', { name: 'Without' }).children).toHaveLength(2)
    const circular = screen.getByRole('progressbar', { name: 'Circular' })
    expect(circular.children).toHaveLength(1)
    expect(circular.firstElementChild!.children).toHaveLength(2)
  })

  it('draws a circular indicator in a box of its size', () => {
    render(
      <>
        <CircularProgressIndicator aria-label="Flat" value={40} />
        <CircularProgressIndicator aria-label="Wavy" shape="wavy" value={40} />
        <CircularProgressIndicator aria-label="Large" shape="wavy" size={96} value={40} />
      </>,
    )
    const size = (name: string) =>
      screen.getByRole('progressbar', { name }).style.getPropertyValue('--progress-indicator-size')
    expect(size('Flat')).toBe('48')
    expect(size('Wavy')).toBe('48')
    expect(size('Large')).toBe('96')
  })

  it('draws a wave no shorter than 8dp, or the stroke is thick, and the default for what is not a number', () => {
    render(
      <>
        <CircularProgressIndicator aria-label="Default" shape="wavy" value={40} />
        <CircularProgressIndicator aria-label="Short" shape="wavy" wavelength={8} value={40} />
        <CircularProgressIndicator aria-label="Shorter" shape="wavy" wavelength={4} value={40} />
        <CircularProgressIndicator aria-label="None" shape="wavy" wavelength={0} value={40} />
        <CircularProgressIndicator
          aria-label="Thick"
          shape="wavy"
          wavelength={4}
          thickness={12}
          value={40}
        />
        <CircularProgressIndicator
          aria-label="Thick at it"
          shape="wavy"
          wavelength={12}
          thickness={12}
          value={40}
        />
        <CircularProgressIndicator aria-label="Not one" shape="wavy" wavelength={NaN} value={40} />
      </>,
    )
    // The curves in the active outline: six nodes a wave, so a shorter wave means more of them.
    const curves = (name: string) =>
      (
        screen
          .getByRole('progressbar', { name })
          .firstElementChild!.children[1]!.getAttribute('style')!
          .match(/C/g) ?? []
      ).length
    expect(curves('Short')).toBeGreaterThan(curves('Default'))
    expect(curves('Shorter')).toBe(curves('Short'))
    expect(curves('None')).toBe(curves('Short'))
    expect(curves('Thick')).toBe(curves('Thick at it'))
    expect(curves('Not one')).toBe(curves('Default'))
  })

  it('is as tall as its thickness, and its wave on top of that', () => {
    render(
      <>
        <LinearProgressIndicator aria-label="Flat" value={40} />
        <LinearProgressIndicator aria-label="Wavy" shape="wavy" value={40} />
        <LinearProgressIndicator aria-label="Thick" shape="wavy" thickness={8} value={40} />
      </>,
    )
    const height = (name: string) =>
      screen
        .getByRole('progressbar', { name })
        .style.getPropertyValue('--progress-indicator-height')
    expect(height('Flat')).toBe('4')
    expect(height('Wavy')).toBe('10')
    expect(height('Thick')).toBe('14')
  })

  it('takes a color of the caller in place of its own', () => {
    render(<LinearProgressIndicator aria-label="Loading" value={40} className="text-current" />)
    const indicator = screen.getByRole('progressbar')
    expect(indicator).toHaveClass('text-current')
    expect(indicator).not.toHaveClass('text-primary')
  })

  it("takes a className and a style as functions of React Aria's state, given its default class", () => {
    render(
      <LinearProgressIndicator
        aria-label="Loading"
        value={40}
        className={({ defaultClassName, percentage }) => `${defaultClassName} at-${percentage}`}
        style={({ isIndeterminate }) => ({ opacity: isIndeterminate ? 0.5 : 1 })}
      />,
    )
    const indicator = screen.getByRole('progressbar')
    expect(indicator).toHaveClass('react-aria-ProgressBar', 'at-40', 'progress-indicator-linear')
    expect(indicator.style.opacity).toBe('1')
    expect(indicator.style.getPropertyValue('--progress-indicator-height')).toBe('4')
  })

  it('forwards a ref and other props to the progressbar', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <LinearProgressIndicator
        aria-label="Loading"
        isIndeterminate
        ref={ref}
        data-testid="indicator"
        id="feed"
      />,
    )
    expect(ref.current).toBe(screen.getByTestId('indicator'))
    expect(ref.current).toHaveAttribute('id', 'feed')
    expect(ref.current).toHaveAttribute('role', 'progressbar')
  })
})
