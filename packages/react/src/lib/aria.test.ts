import { describe, expect, expectTypeOf, it } from 'vitest'
import { composeTailwindRenderProps, type Except } from './aria'

describe('Except', () => {
  it('is the props less those named, as Omit leaves them', () => {
    type Props = { label: string; icon?: string; children: () => string }
    expectTypeOf<Except<Props, 'children'>>().toEqualTypeOf<Omit<Props, 'children'>>()
    expectTypeOf<Except<Props, 'children' | 'icon'>>().toEqualTypeOf<{ label: string }>()
  })
})

describe('composeTailwindRenderProps', () => {
  type State = { isSelected: boolean }
  const state = { isSelected: true }

  it("puts the component's own classes first, the caller's after, the caller's winning a conflict", () => {
    const composed = composeTailwindRenderProps<State>(
      'm-space-100 flex',
      'inline-flex items-center',
    )
    expect(typeof composed === 'function' && composed(state)).toBe('items-center m-space-100 flex')
  })

  it("resolves the caller's function against the state, and gives the own classes alone without one", () => {
    const composed = composeTailwindRenderProps<State>(
      ({ isSelected }) => (isSelected ? 'text-primary' : 'text-on-surface'),
      'text-label-lg text-on-surface',
    )
    expect(typeof composed === 'function' && composed(state)).toBe('text-label-lg text-primary')
    const own = composeTailwindRenderProps<State>(undefined, 'inline-flex')
    expect(typeof own === 'function' && own(state)).toBe('inline-flex')
  })
})
