import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { twMerge } from '../../../react/src/lib/tv'

/*
 * Reference page for the motion tokens. Easings are drawn as their curve, read
 * from the CSS variable so the page cannot drift from the tokens, and each
 * dot travels its track with its own ease-* utility. Durations fill a bar with
 * their own duration-* utility. Springs are drawn from their linear() easing
 * and settle with their own ease-spring-* and duration-spring-* utilities; the
 * Motion toolbar switches between the expressive and standard schemes. Play
 * runs all three. With prefers-reduced-motion everything is instant. The class names are spelled
 * out in full because Tailwind only generates utilities it finds as literal
 * strings.
 */
const easings = [
  { label: 'Standard', variable: '--md-sys-motion-easing-standard', ease: 'ease-standard' },
  {
    label: 'Standard accelerate',
    variable: '--md-sys-motion-easing-standard-accelerate',
    ease: 'ease-standard-accelerate',
  },
  {
    label: 'Standard decelerate',
    variable: '--md-sys-motion-easing-standard-decelerate',
    ease: 'ease-standard-decelerate',
  },
  { label: 'Emphasized', variable: '--md-sys-motion-easing-emphasized', ease: 'ease-emphasized' },
  {
    label: 'Emphasized accelerate',
    variable: '--md-sys-motion-easing-emphasized-accelerate',
    ease: 'ease-emphasized-accelerate',
  },
  {
    label: 'Emphasized decelerate',
    variable: '--md-sys-motion-easing-emphasized-decelerate',
    ease: 'ease-emphasized-decelerate',
  },
  { label: 'Linear', variable: '--md-sys-motion-easing-linear', ease: 'ease-linear' },
]

const durations = [
  { label: 'Short 1', ms: 50, classes: 'duration-short-1' },
  { label: 'Short 2', ms: 100, classes: 'duration-short-2' },
  { label: 'Short 3', ms: 150, classes: 'duration-short-3' },
  { label: 'Short 4', ms: 200, classes: 'duration-short-4' },
  { label: 'Medium 1', ms: 250, classes: 'duration-medium-1' },
  { label: 'Medium 2', ms: 300, classes: 'duration-medium-2' },
  { label: 'Medium 3', ms: 350, classes: 'duration-medium-3' },
  { label: 'Medium 4', ms: 400, classes: 'duration-medium-4' },
  { label: 'Long 1', ms: 450, classes: 'duration-long-1' },
  { label: 'Long 2', ms: 500, classes: 'duration-long-2' },
  { label: 'Long 3', ms: 550, classes: 'duration-long-3' },
  { label: 'Long 4', ms: 600, classes: 'duration-long-4' },
  { label: 'Extra long 1', ms: 700, classes: 'duration-extra-long-1' },
  { label: 'Extra long 2', ms: 800, classes: 'duration-extra-long-2' },
  { label: 'Extra long 3', ms: 900, classes: 'duration-extra-long-3' },
  { label: 'Extra long 4', ms: 1000, classes: 'duration-extra-long-4' },
]

const springs = [
  {
    label: 'Fast spatial',
    name: 'fast-spatial',
    classes: 'duration-spring-fast-spatial ease-spring-fast-spatial',
  },
  {
    label: 'Default spatial',
    name: 'default-spatial',
    classes: 'duration-spring-default-spatial ease-spring-default-spatial',
  },
  {
    label: 'Slow spatial',
    name: 'slow-spatial',
    classes: 'duration-spring-slow-spatial ease-spring-slow-spatial',
  },
  {
    label: 'Fast effects',
    name: 'fast-effects',
    classes: 'duration-spring-fast-effects ease-spring-fast-effects',
  },
  {
    label: 'Default effects',
    name: 'default-effects',
    classes: 'duration-spring-default-effects ease-spring-default-effects',
  },
  {
    label: 'Slow effects',
    name: 'slow-effects',
    classes: 'duration-spring-slow-effects ease-spring-slow-effects',
  },
]

const curveSize = 64

/** Reads `cubic-bezier(x1, y1, x2, y2)` from a CSS variable on the page. */
function readBezier(variable: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable)
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = value.match(/-?\d*\.?\d+/g)?.map(Number) ?? []
  return { x1, y1, x2, y2 }
}

const rootVariable = (variable: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(variable).trim()

/** A spring drawn from its linear() easing; the y axis leaves room to overshoot 1. */
function SpringCurve({ name }: { name: string }) {
  const points = (rootVariable(`--md-sys-motion-spring-${name}-easing`).match(/-?\d*\.?\d+/g) ?? [])
    .map(Number)
    .map((y, i, all) => `${(i / (all.length - 1)) * curveSize},${(1.25 - y) * curveSize * 0.8}`)
  return (
    <svg
      viewBox={`0 0 ${curveSize} ${curveSize}`}
      className="size-[64px] shrink-0 overflow-visible"
      aria-hidden
    >
      <rect width={curveSize} height={curveSize} className="fill-none stroke-outline-variant" />
      <polyline points={points.join(' ')} className="fill-none stroke-primary stroke-2" />
    </svg>
  )
}

function EasingCurve({ variable }: { variable: string }) {
  const { x1, y1, x2, y2 } = readBezier(variable)
  const p = (x: number, y: number) => `${x * curveSize} ${(1 - y) * curveSize}`
  return (
    <svg
      viewBox={`0 0 ${curveSize} ${curveSize}`}
      className="size-[64px] shrink-0 overflow-visible"
      aria-hidden
    >
      <rect width={curveSize} height={curveSize} className="fill-none stroke-outline-variant" />
      <path
        d={`M ${p(0, 0)} C ${p(x1, y1)}, ${p(x2, y2)}, ${p(1, 1)}`}
        className="fill-none stroke-primary stroke-2"
      />
    </svg>
  )
}

function Motion() {
  const [played, setPlayed] = useState(false)
  return (
    <div className="box-border min-h-screen bg-surface p-space-400 font-plain text-on-surface antialiased">
      <button
        type="button"
        onClick={() => setPlayed((value) => !value)}
        className="mb-space-400 h-[40px] cursor-pointer rounded-shape-full border-0 bg-primary px-space-300 text-label-lg text-on-primary"
      >
        {played ? 'Reset' : 'Play'}
      </button>

      <h2 className="m-0 mb-space-200 text-title-md">Easing</h2>
      <div className="mb-space-500 flex flex-col gap-space-200">
        {easings.map(({ label, variable, ease }) => (
          <div key={label} className="flex items-center gap-space-200">
            <EasingCurve variable={variable} />
            <div className="w-[176px] shrink-0">
              <div className="text-title-sm">{label}</div>
              <div className="text-body-sm text-on-surface-variant">{ease}</div>
            </div>
            <div className="relative h-[24px] w-[400px] rounded-shape-full bg-surface-container-highest">
              <div
                className={twMerge(
                  'absolute top-0 size-[24px] rounded-shape-full bg-primary transition-[left] duration-long-4',
                  ease,
                  played ? 'left-[calc(100%-24px)]' : 'left-0',
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <h2 className="m-0 mb-space-200 text-title-md">Springs</h2>
      <div className="mb-space-500 flex flex-col gap-space-200">
        {springs.map(({ label, name, classes }) => (
          <div key={label} className="flex items-center gap-space-200">
            <SpringCurve name={name} />
            <div className="w-[176px] shrink-0">
              <div className="text-title-sm">{label}</div>
              <div className="text-body-sm text-on-surface-variant">
                {rootVariable(`--md-sys-motion-spring-${name}-damping`)} damping,{' '}
                {rootVariable(`--md-sys-motion-spring-${name}-stiffness`)} stiffness,{' '}
                {rootVariable(`--md-sys-motion-spring-${name}-duration`)}
              </div>
            </div>
            <div className="relative h-[24px] w-[400px] rounded-shape-full bg-surface-container-highest">
              <div
                className={twMerge(
                  'absolute top-0 size-[24px] rounded-shape-full bg-primary transition-[left]',
                  classes,
                  played ? 'left-[calc(100%-24px)]' : 'left-0',
                )}
              />
            </div>
          </div>
        ))}
      </div>

      <h2 className="m-0 mb-space-200 text-title-md">Duration</h2>
      <div className="flex flex-col gap-space-100">
        {durations.map(({ label, ms, classes }) => (
          <div key={label} className="flex items-center gap-space-200">
            <div className="w-[96px] shrink-0 text-title-sm">{label}</div>
            <div className="w-[56px] shrink-0 text-body-sm text-on-surface-variant">{ms}ms</div>
            <div className="h-[12px] w-[400px] rounded-shape-full bg-surface-container-highest">
              <div
                className={twMerge(
                  'h-full rounded-shape-full bg-primary transition-[width] ease-linear',
                  classes,
                  played ? 'w-full' : 'w-0',
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const meta = {
  title: 'Styles/Motion',
  component: Motion,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Motion>

export default meta
type Story = StoryObj<typeof meta>

export const EasingAndDuration: Story = { name: 'Easing and duration' }
