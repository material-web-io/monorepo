import { twMerge } from '@material-web/react'

const corners = [
  ['rounded-shape-none', '0'],
  ['rounded-shape-xs', '4'],
  ['rounded-shape-sm', '8'],
  ['rounded-shape-md', '12'],
  ['rounded-shape-lg', '16'],
  ['rounded-shape-lg-inc', '20'],
  ['rounded-shape-xl', '28'],
  ['rounded-shape-xl-inc', '32'],
  ['rounded-shape-2xl', '48'],
  ['rounded-shape-full', 'full'],
] as const

export default function ShapeScale() {
  return (
    <div className="grid w-full grid-cols-2 gap-space-200 medium-screen:grid-cols-5">
      {corners.map(([corner, size]) => (
        <div key={corner} className="flex flex-col items-center gap-space-100">
          <div
            className={twMerge(
              corner,
              'flex size-24 items-center justify-center bg-primary-container text-title-md text-on-primary-container',
            )}
          >
            {size}
          </div>
          <code className="font-mono text-label-md text-on-surface-variant">{corner}</code>
        </div>
      ))}
    </div>
  )
}
