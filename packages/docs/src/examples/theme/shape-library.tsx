import { twMerge } from '@material-web/react'

const shapes = [
  'shape-circle',
  'shape-square',
  'shape-slanted',
  'shape-arch',
  'shape-fan',
  'shape-arrow',
  'shape-semicircle',
  'shape-oval',
  'shape-pill',
  'shape-triangle',
  'shape-diamond',
  'shape-clamshell',
  'shape-pentagon',
  'shape-gem',
  'shape-very-sunny',
  'shape-sunny',
  'shape-4-sided-cookie',
  'shape-6-sided-cookie',
  'shape-7-sided-cookie',
  'shape-9-sided-cookie',
  'shape-12-sided-cookie',
  'shape-ghost-ish',
  'shape-4-leaf-clover',
  'shape-8-leaf-clover',
  'shape-burst',
  'shape-soft-burst',
  'shape-boom',
  'shape-soft-boom',
  'shape-flower',
  'shape-puffy',
  'shape-puffy-diamond',
  'shape-pixel-circle',
  'shape-pixel-triangle',
  'shape-bun',
  'shape-heart',
]

export default function ShapeLibrary() {
  return (
    <div className="grid w-full grid-cols-2 gap-x-space-200 gap-y-space-300 medium-screen:grid-cols-5">
      {shapes.map((shape) => (
        <div key={shape} className="flex flex-col items-center gap-space-100">
          <div className={twMerge(shape, 'size-20 bg-primary')} />
          <code className="font-mono text-label-md text-on-surface-variant">{shape}</code>
        </div>
      ))}
    </div>
  )
}
