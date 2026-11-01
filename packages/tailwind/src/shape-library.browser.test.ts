import { compile } from 'tailwindcss'
import { commands, page } from 'vitest/browser'
import { afterEach, describe, expect, it } from 'vitest'
import shapeLibrary from './shape-library.css?raw'

/*
 * The shape library (shape-library.css), built by Tailwind from the file itself, since the theme's
 * files are no source of the test stylesheet: the clip-paths the classes give, and what a box cut
 * to each paints, read off a screenshot.
 */

// The shape set as Material lists it, row by row.
const shapes = [
  'circle',
  'square',
  'slanted',
  'arch',
  'fan',
  'arrow',
  'semicircle',
  'oval',
  'pill',
  'triangle',
  'diamond',
  'clamshell',
  'pentagon',
  'gem',
  'very-sunny',
  'sunny',
  '4-sided-cookie',
  '6-sided-cookie',
  '7-sided-cookie',
  '9-sided-cookie',
  '12-sided-cookie',
  'ghost-ish',
  '4-leaf-clover',
  '8-leaf-clover',
  'burst',
  'soft-burst',
  'boom',
  'soft-boom',
  'flower',
  'puffy',
  'puffy-diamond',
  'pixel-circle',
  'pixel-triangle',
  'bun',
  'heart',
]

const added: Element[] = []

afterEach(() => {
  for (const element of added.splice(0)) element.remove()
})

/**
 * Black boxes of a size with these classes, styled by Tailwind's build of the shape library, with
 * any `css` of a test's own after it and any `more` classes, in a white grid of seven columns.
 */
async function boxes(
  classes: string[],
  { width = 100, height = 100, more = [] as string[], css = '' } = {},
) {
  const compiler = await compile(`@tailwind utilities;\n${shapeLibrary}\n${css}`)
  const style = document.createElement('style')
  style.textContent = compiler.build([
    ...classes.flatMap((className) => className.split(' ')),
    ...more,
  ])
  const grid = document.createElement('div')
  grid.style.cssText = `display: grid; grid-template-columns: repeat(7, ${width}px); gap: 20px; width: max-content; background: white`
  for (const className of classes) {
    const box = document.createElement('div')
    box.className = className
    box.style.cssText = `width: ${width}px; height: ${height}px; background: black`
    grid.append(box)
  }
  document.head.append(style)
  document.body.append(grid)
  added.push(style, grid)
  return [...grid.children] as HTMLElement[]
}

/**
 * The color at x, y CSS px from a box's top left corner, read off a screenshot of the grid: its
 * black, a child's red, or the grid's white where the box paints nothing.
 */
async function colors(grid: HTMLElement) {
  const image = new Image()
  image.src = `data:image/png;base64,${await page.screenshot({ element: grid, save: false })}`
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')!
  context.drawImage(image, 0, 0)
  const origin = grid.getBoundingClientRect()
  const scale = image.width / origin.width
  return (box: HTMLElement, x: number, y: number) => {
    const rect = box.getBoundingClientRect()
    const [left, top] = [rect.left - origin.left + x, rect.top - origin.top + y]
    const [red, green] = context.getImageData(
      Math.floor(left * scale),
      Math.floor(top * scale),
      1,
      1,
    ).data
    if (green! > 128) return 'white'
    return red! > 128 ? 'red' : 'black'
  }
}

/** Whether a box paints at x, y CSS px from its top left corner. */
async function painting(grid: HTMLElement) {
  const at = await colors(grid)
  return (box: HTMLElement, x: number, y: number) => at(box, x, y) !== 'white'
}

describe('shape library', () => {
  it('has a theme variable and a class for each shape of the shape set, and no other', async () => {
    const clips = (await boxes(shapes.map((shape) => `shape-${shape}`))).map(
      (box) => getComputedStyle(box).clipPath,
    )
    for (const clip of clips) expect(clip).toMatch(/^polygon\(/)
    expect(new Set(clips).size).toBe(shapes.length)
    expect(shapeLibrary.match(/^ {2}--shape-[a-z0-9-]+: polygon\(/gm)).toHaveLength(shapes.length)
  })

  it('paints each shape filled in the middle and clear at the corners', async () => {
    const all = await boxes(shapes.map((shape) => `shape-${shape}`))
    const paints = await painting(all[0]!.parentElement!)
    const corners = [
      [1, 1],
      [98, 1],
      [1, 98],
      [98, 98],
    ] as const
    for (const box of all) {
      expect([box.className, paints(box, 50, 50)]).toEqual([box.className, true])
      for (const [x, y] of corners) {
        expect([box.className, x, y, paints(box, x, y)]).toEqual([box.className, x, y, false])
      }
    }
  })

  it('stretches the shape to the border box, as Compose scales a shape to its size', async () => {
    const [box] = await boxes(['shape-circle'], { width: 200, height: 100 })
    // Twice as wide as it is tall, the circle is an ellipse that reaches both sides.
    const paints = await painting(box!.parentElement!)
    expect([paints(box!, 3, 50), paints(box!, 197, 50), paints(box!, 100, 3)]).toEqual([
      true,
      true,
      true,
    ])
  })

  it('takes clicks only within the shape', async () => {
    const [box] = await boxes(['shape-circle'])
    const rect = box!.getBoundingClientRect()
    const at = (x: number, y: number) => document.elementFromPoint(rect.left + x, rect.top + y)
    expect([at(50, 50), at(3, 3)]).toEqual([box, box!.parentElement])
  })

  it('keeps a mask of Tailwind’s on a shape, apart from it', async () => {
    const [box] = await boxes(['shape-circle mask-b-from-50%'])
    const style = getComputedStyle(box!)
    expect([style.clipPath.slice(0, 8), style.maskImage.slice(0, 16)]).toEqual([
      'polygon(',
      'linear-gradient(',
    ])
    // The circle, faded out toward its bottom.
    const at = await colors(box!.parentElement!)
    expect([at(box!, 50, 40), at(box!, 50, 97), at(box!, 3, 3)]).toEqual([
      'black',
      'white',
      'white',
    ])
  })

  it('takes the shape off with shape-none', async () => {
    const [none] = await boxes(['shape-circle shape-none'])
    expect(getComputedStyle(none!).clipPath).toBe('none')
    const paints = await painting(none!.parentElement!)
    expect(paints(none!, 1, 1)).toBe(true)
  })

  it('takes a new shape, or a shape of the library replaced, from a --shape-<name> variable', async () => {
    // A new shape, the left half of the box, and the circle replaced by the bottom half: any
    // clip-path, a polygon or an inset.
    const [added, replaced] = await boxes(['shape-left-half', 'shape-circle'], {
      css: '@theme { --shape-left-half: polygon(0 0, 50% 0, 50% 100%, 0 100%); --shape-circle: inset(50% 0 0 0); }',
    })
    const paints = await painting(added!.parentElement!)
    expect([
      paints(added!, 25, 50),
      paints(added!, 75, 50),
      paints(replaced!, 50, 75),
      paints(replaced!, 50, 25),
    ]).toEqual([true, false, true, false])
  })
})

describe('shape rotation', () => {
  afterEach(async () => {
    await commands.emulateReducedMotion('no-preference')
  })

  /** A child of the box's size, red along its top and black below. */
  function content(box: HTMLElement) {
    const child = document.createElement('div')
    child.style.cssText =
      'width: 100%; height: 100%; background: linear-gradient(red 30%, black 30%)'
    box.append(child)
    return child
  }

  /** A semicircle, round side up when not turned, holding a child red along its top. */
  async function turned(className: string, more: string[] = []) {
    const [box] = await boxes([`shape-semicircle ${className}`], { more })
    return [box!, content(box!)] as const
  }

  /** A spinning box held a quarter of the way round, 5s into its 20s turn. */
  function quarterWay(box: HTMLElement) {
    box.style.animationDelay = '-5s'
    box.style.animationPlayState = 'paused'
  }

  const rotate = (element: Element) => getComputedStyle(element).rotate

  // A quarter turn right stands the semicircle from top to bottom and off the box's sides. Its
  // content, turned back, keeps its red along the top.
  const quarterTurned = ['red', 'white', 'red', 'black']
  const points = [
    [50, 5],
    [5, 50],
    [50, 20],
    [50, 60],
  ] as const

  it('turns the shape by shape-rotate-<n>, and not its content', async () => {
    const [right, child] = await turned('shape-rotate-90')
    const [left] = await turned('-shape-rotate-90')
    const [arbitrary] = await turned('shape-rotate-[0.25turn]')
    expect([rotate(right), rotate(child), rotate(left), rotate(arbitrary)]).toEqual([
      '90deg',
      '-90deg',
      '-90deg',
      '90deg',
    ])
    const at = await colors(right.parentElement!)
    expect(points.map(([x, y]) => at(right, x, y))).toEqual(quarterTurned)
  })

  it('spins the shape with animate-shape-spin, and keeps its content upright', async () => {
    const [box, child] = await turned('animate-shape-spin')
    quarterWay(box)
    expect(getComputedStyle(box).animationDuration).toBe('20s')
    expect([rotate(box), rotate(child)]).toEqual(['90deg', '-90deg'])
    const at = await colors(box.parentElement!)
    expect(points.map(([x, y]) => at(box, x, y))).toEqual(quarterTurned)
    // A child added while it turns takes the turn it is at, not one of its own.
    expect(rotate(content(box))).toBe('-90deg')
  })

  it('adds the spin to the turn, and leaves a shape inside the content its own', async () => {
    const [box, child] = await turned('shape-rotate-45 animate-shape-spin', ['shape-rotate-30'])
    quarterWay(box)
    const inner = document.createElement('div')
    inner.className = 'shape-rotate-30'
    child.append(inner)
    expect([rotate(box), rotate(child), rotate(inner)]).toEqual(['135deg', '-135deg', '30deg'])
  })

  it('holds the shape still for a reader who asked for reduced motion', async () => {
    await commands.emulateReducedMotion('reduce')
    const [box, child] = await turned('shape-rotate-45 animate-shape-spin')
    expect(getComputedStyle(box).animationName).toBe('none')
    expect([rotate(box), rotate(child)]).toEqual(['45deg', '-45deg'])
  })
})
