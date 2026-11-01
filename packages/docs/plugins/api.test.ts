import { describe, expect, it } from 'vitest'
import { readApi } from './api.ts'

describe('readApi', () => {
  // One program for the whole file: reading the types takes a second or two.
  const { apis } = readApi()

  it('reads the props a component adds, with their types, defaults and sources', () => {
    const variant = apis.get('Button')?.own.find((prop) => prop.name === 'variant')
    expect(variant?.type).toBe("'text' | 'elevated' | 'filled' | 'tonal' | 'outlined'")
    expect(variant?.default).toBe("'filled'")
    expect(variant?.isRequired).toBe(false)
    expect(variant?.see).toContain('https://m3.material.io/components/buttons/overview')
    expect(variant?.description).toContain('<li>')
  })

  it('lists the props of the React Aria component apart, with the ones only retyped', () => {
    const inherited = apis.get('Button')?.inherited.map((prop) => prop.name)
    expect(inherited).toEqual(expect.arrayContaining(['isDisabled', 'onPress', 'className']))
    expect(inherited).not.toContain('variant')
  })

  it('joins the types a prop has across a union of props', () => {
    const isSelectable = apis.get('Button')?.own.find((prop) => prop.name === 'isSelectable')
    expect(isSelectable?.type).toBe('boolean')
  })

  it('counts the attributes of an element instead of listing them', () => {
    const card = apis.get('Card')
    expect(card?.own.map((prop) => prop.name)).toEqual(['variant'])
    expect(card?.domCount).toBeGreaterThan(100)
    expect(card?.inherited.map((prop) => prop.name)).toEqual(['ref'])
  })

  it('keeps only the addresses of what a comment refers to', () => {
    // React's own comment on `ref` refers to its docs with a {@link} and a name after it.
    expect(apis.get('Card')?.inherited[0]?.see).toEqual([
      'https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom',
    ])
    const see = [...apis.values()].flatMap((api) =>
      [...api.own, ...api.inherited].flatMap((prop) => prop.see),
    )
    expect(see.filter((address) => !URL.canParse(address))).toEqual([])
  })

  it('prints a type that depends on a type parameter as what it is at most', () => {
    const chip = apis.get('Chip')
    expect(chip?.own.find((prop) => prop.name === 'variant')?.type).toBe(
      "'input' | 'filter' | 'assist' | 'suggestion'",
    )
    const value = apis.get('SearchField')?.inherited.find((prop) => prop.name === 'value')
    expect(value?.type).toBe('string')
  })

  it('leaves out what is no component', () => {
    expect(apis.has('tv')).toBe(false)
    expect(apis.has('SnackbarQueue')).toBe(false)
  })
})
