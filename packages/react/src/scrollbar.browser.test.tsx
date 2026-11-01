import { render, screen } from '@testing-library/react'
import { I18nProvider, MenuTrigger } from 'react-aria-components'
import { userEvent } from 'vitest/browser'
import { afterEach, describe, expect, it } from 'vitest'
import { Button } from './components/button'
import { Menu, MenuItem, MenuPopover } from './components/menu'
import { Scheme, button, computedColor, schemes, settle, useForcedColors } from './test-browser'

/*
 * The scrollbar every scroll container gets (layout.css) and a menu's own place for it
 * (menu.css), read from the scrollbar parts' computed styles: the test browser hides scrollbars.
 */

/** A box that scrolls both ways, with nothing of the library's on it. */
function Scroller({ className }: { className?: string }) {
  return (
    <div
      data-testid="scroller"
      className={className}
      style={{ width: 120, height: 120, overflow: 'auto' }}
    >
      <div style={{ width: 400, height: 400 }} />
    </div>
  )
}

const scroller = () => screen.getByTestId('scroller')

/** The computed style of one of an element's scrollbar parts. */
const part = (el: Element, name: 'scrollbar' | 'scrollbar-thumb' | 'scrollbar-track') =>
  getComputedStyle(el, `::-webkit-${name}`)

/** A menu of more states than fit the window, opened, in a document read in `dir`: its list, which scrolls. */
async function openMenu(dir: 'ltr' | 'rtl' = 'ltr') {
  document.documentElement.dir = dir
  // React Aria reads the direction from its locale, the panel carrying its own `dir`.
  render(
    <I18nProvider locale={dir === 'rtl' ? 'he-IL' : 'en-US'}>
      <div style={{ padding: 64 }}>
        <MenuTrigger>
          <Button variant="outlined">State</Button>
          <MenuPopover>
            <Menu>
              {Array.from({ length: 40 }, (_, i) => (
                <MenuItem key={i}>{`State ${i}`}</MenuItem>
              ))}
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </div>
    </I18nProvider>,
  )
  await userEvent.click(button('State'))
  await settle()
  return screen.getByRole('menu')
}

afterEach(() => {
  document.documentElement.removeAttribute('dir')
})

describe('The scrollbar in a browser', () => {
  it('is 4px thick on any scroll container, down its side and along its bottom', () => {
    render(<Scroller />)
    expect(part(scroller(), 'scrollbar').width).toBe('4px')
    expect(part(scroller(), 'scrollbar').height).toBe('4px')
  })

  it.each(schemes)(
    'has a round outline thumb and no track in %s, %s contrast',
    (theme, contrast) => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <Scroller />
        </Scheme>,
      )
      const thumb = part(scroller(), 'scrollbar-thumb')
      expect(thumb.backgroundColor).toBe(computedColor('var(--md-sys-color-outline)', scroller()))
      expect(parseFloat(thumb.borderTopLeftRadius)).toBeGreaterThanOrEqual(2)
      expect(part(scroller(), 'scrollbar-track').backgroundColor).toBe('rgba(0, 0, 0, 0)')
    },
  )

  it('leaves the standard scrollbar properties alone where the parts are styled, which would replace them', () => {
    render(<Scroller />)
    expect(CSS.supports('selector(::-webkit-scrollbar)')).toBe(true)
    expect(getComputedStyle(scroller()).scrollbarWidth).toBe('auto')
    expect(getComputedStyle(scroller()).scrollbarColor).toBe('auto')
  })

  it('gives way to scrollbar-hidden', () => {
    render(<Scroller className="scrollbar-hidden" />)
    expect(part(scroller(), 'scrollbar').display).toBe('none')
    expect(getComputedStyle(scroller()).scrollbarWidth).toBe('none')
  })

  describe('in a menu', () => {
    it('is 4px in from the panel’s end edge, the thumb’s own clear border, and stops 12px short of its ends', async () => {
      const list = await openMenu()
      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
      expect(part(list, 'scrollbar').width).toBe('8px')
      const thumb = part(list, 'scrollbar-thumb')
      expect(thumb.borderRightWidth).toBe('4px')
      expect(thumb.borderLeftWidth).toBe('0px')
      expect(thumb.borderRightColor).toBe('rgba(0, 0, 0, 0)')
      expect(thumb.backgroundClip).toBe('padding-box')
      expect(thumb.backgroundColor).toBe(computedColor('var(--md-sys-color-outline)', list))
      expect(part(list, 'scrollbar-track').marginTop).toBe('12px')
      expect(part(list, 'scrollbar-track').marginBottom).toBe('12px')
    })

    it('rounds the 4px of thumb left by 2px: its corners over the border are that border wider', async () => {
      const thumb = part(await openMenu(), 'scrollbar-thumb')
      expect(thumb.borderTopLeftRadius).toBe('2px')
      expect(thumb.borderBottomLeftRadius).toBe('2px')
      expect(thumb.borderTopRightRadius).toBe('6px 2px')
      expect(thumb.borderBottomRightRadius).toBe('6px 2px')
    })

    it('is mirrored right to left, where the scrollbar is on the left', async () => {
      const thumb = part(await openMenu('rtl'), 'scrollbar-thumb')
      expect(thumb.borderLeftWidth).toBe('4px')
      expect(thumb.borderRightWidth).toBe('0px')
      expect(thumb.borderTopLeftRadius).toBe('6px 2px')
      expect(thumb.borderTopRightRadius).toBe('2px')
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('paints the thumb ButtonText, not the canvas color it lies on', () => {
      render(<Scroller />)
      const thumb = part(scroller(), 'scrollbar-thumb')
      expect(thumb.backgroundColor).toBe(computedColor('ButtonText', scroller()))
      expect(thumb.backgroundColor).not.toBe(computedColor('Canvas', scroller()))
    })

    it('keeps a menu’s thumb 4px in, its border the canvas color', async () => {
      const list = await openMenu()
      const thumb = part(list, 'scrollbar-thumb')
      expect(thumb.borderRightWidth).toBe('4px')
      expect(thumb.borderRightColor).toBe(computedColor('Canvas', list))
      expect(thumb.backgroundColor).toBe(computedColor('ButtonText', list))
    })
  })
})
