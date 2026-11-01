import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { computedColor, Scheme, schemes, useForcedColors } from '../../test-browser'
import { Divider } from './divider'

/* What needs a real browser and stylesheet: the line's thickness and color, the
 * browser's own <hr> styling being gone, the 16dp insets and their side in rtl,
 * how it fills a block, flex column or row, and forced colors. Markup: divider.test.tsx. */

const divider = () => screen.getByRole('separator')

/** A 400px-wide box for a horizontal divider, on a painted surface. */
function Box({
  dir,
  centered,
  children,
}: {
  dir?: 'rtl'
  centered?: boolean
  children: ReactNode
}) {
  return (
    <Scheme>
      <div
        data-testid="box"
        dir={dir}
        style={{
          width: 400,
          display: centered ? 'flex' : undefined,
          flexDirection: centered ? 'column' : undefined,
          alignItems: centered ? 'center' : undefined,
        }}
      >
        {children}
      </div>
    </Scheme>
  )
}

const box = () => screen.getByTestId('box').getBoundingClientRect()

describe('Divider in a browser', () => {
  it('is a 1dp solid line in the outline-variant color', () => {
    render(
      <Box>
        <Divider />
      </Box>,
    )
    const el = divider()
    const style = getComputedStyle(el)
    expect(el.getBoundingClientRect().height).toBe(1)
    expect(style.borderTopWidth).toBe('1px')
    expect(style.borderTopStyle).toBe('solid')
    expect(style.borderTopColor).toBe(computedColor('var(--md-sys-color-outline-variant)', el))
  })

  it("has none of the browser's own <hr> margin or bevelled border", () => {
    render(
      <Box>
        <Divider />
      </Box>,
    )
    const style = getComputedStyle(divider())
    expect([style.marginTop, style.marginRight, style.marginBottom, style.marginLeft]).toEqual([
      '0px',
      '0px',
      '0px',
      '0px',
    ])
    expect([style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth]).toEqual([
      '0px',
      '0px',
      '0px',
    ])
  })

  it.each(schemes)(
    'takes the outline-variant color of the %s scheme at %s contrast',
    (theme, contrast) => {
      render(
        <Scheme theme={theme} contrast={contrast}>
          <div style={{ width: 400 }}>
            <Divider />
          </div>
        </Scheme>,
      )
      const el = divider()
      expect(getComputedStyle(el).borderTopColor).toBe(
        computedColor('var(--md-sys-color-outline-variant)', el),
      )
    },
  )

  it('takes a margin of the caller over its own', () => {
    render(
      <Box>
        <Divider className="my-space-200" />
      </Box>,
    )
    const style = getComputedStyle(divider())
    expect([style.marginTop, style.marginBottom]).toEqual(['16px', '16px'])
  })

  it('spans the full width of its container', () => {
    render(
      <Box>
        <Divider />
      </Box>,
    )
    const rect = divider().getBoundingClientRect()
    expect([rect.left, rect.right]).toEqual([box().left, box().right])
  })

  it('still spans a flex column that centers its items', () => {
    render(
      <Box centered>
        <Divider />
      </Box>,
    )
    const rect = divider().getBoundingClientRect()
    expect([rect.left, rect.right]).toEqual([box().left, box().right])
  })

  it('starts 16dp in and reaches the trailing edge when inset', () => {
    render(
      <Box>
        <Divider variant="inset" />
      </Box>,
    )
    const rect = divider().getBoundingClientRect()
    expect([rect.left, rect.right]).toEqual([box().left + 16, box().right])
  })

  it('is 16dp in on both sides when middle-inset', () => {
    render(
      <Box>
        <Divider variant="middle-inset" />
      </Box>,
    )
    const rect = divider().getBoundingClientRect()
    expect([rect.left, rect.right]).toEqual([box().left + 16, box().right - 16])
  })

  it('insets from the leading edge, which is the right one in a right-to-left layout', () => {
    render(
      <Box dir="rtl">
        <Divider variant="inset" />
      </Box>,
    )
    const rect = divider().getBoundingClientRect()
    expect([rect.left, rect.right]).toEqual([box().left, box().right - 16])
  })

  describe('vertical', () => {
    // Scheme is a flex row that centers its items; the tall sibling sets the row's height.
    const Row = ({ children }: { children: ReactNode }) => (
      <Scheme>
        <div data-testid="tall" style={{ height: 100, width: 40 }} />
        {children}
      </Scheme>
    )
    const tall = () => screen.getByTestId('tall').getBoundingClientRect()

    it('is a 1dp line drawn along its start edge', () => {
      render(
        <Row>
          <Divider orientation="vertical" />
        </Row>,
      )
      const el = divider()
      const style = getComputedStyle(el)
      expect(el.getBoundingClientRect().width).toBe(1)
      expect(style.borderLeftWidth).toBe('1px')
      expect(style.borderLeftStyle).toBe('solid')
      expect(style.borderLeftColor).toBe(computedColor('var(--md-sys-color-outline-variant)', el))
      expect([style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth]).toEqual([
        '0px',
        '0px',
        '0px',
      ])
    })

    it('stretches to the height of the row it is in', () => {
      render(
        <Row>
          <Divider orientation="vertical" />
        </Row>,
      )
      const rect = divider().getBoundingClientRect()
      expect([rect.top, rect.bottom]).toEqual([tall().top, tall().bottom])
    })

    it('starts 16dp down when inset, and 16dp in at both ends when middle-inset', () => {
      render(
        <Row>
          <Divider orientation="vertical" variant="inset" data-testid="inset" />
          <Divider orientation="vertical" variant="middle-inset" data-testid="middle" />
        </Row>,
      )
      const inset = screen.getByTestId('inset').getBoundingClientRect()
      const middle = screen.getByTestId('middle').getBoundingClientRect()
      expect([inset.top, inset.bottom]).toEqual([tall().top + 16, tall().bottom])
      expect([middle.top, middle.bottom]).toEqual([tall().top + 16, tall().bottom - 16])
    })
  })

  describe('forced colors', () => {
    useForcedColors()

    it('is really emulated, so the check below runs in forced colors', () => {
      expect(matchMedia('(forced-colors: active)').matches).toBe(true)
    })

    it('keeps a visible 1dp line, in the system text color', () => {
      render(
        <Box>
          <Divider />
        </Box>,
      )
      const el = divider()
      const style = getComputedStyle(el)
      expect(el.getBoundingClientRect().height).toBe(1)
      expect(style.borderTopWidth).toBe('1px')
      expect(style.borderTopColor).toBe(computedColor('CanvasText', el))
    })
  })
})
