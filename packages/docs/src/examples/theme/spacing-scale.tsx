import { twMerge } from '@material-web/react'

const spaces = [
  ['w-space-0', 'space-0', 0],
  ['w-space-25', 'space-25', 2],
  ['w-space-50', 'space-50', 4],
  ['w-space-75', 'space-75', 6],
  ['w-space-100', 'space-100', 8],
  ['w-space-125', 'space-125', 10],
  ['w-space-150', 'space-150', 12],
  ['w-space-175', 'space-175', 14],
  ['w-space-200', 'space-200', 16],
  ['w-space-250', 'space-250', 20],
  ['w-space-300', 'space-300', 24],
  ['w-space-400', 'space-400', 32],
  ['w-space-450', 'space-450', 36],
  ['w-space-500', 'space-500', 40],
  ['w-space-600', 'space-600', 48],
  ['w-space-700', 'space-700', 56],
  ['w-space-800', 'space-800', 64],
  ['w-space-900', 'space-900', 72],
] as const

export default function SpacingScale() {
  return (
    <div className="flex flex-col gap-space-75">
      {spaces.map(([width, name, dp]) => (
        <div key={name} className="flex items-center gap-space-200">
          <code className="w-20 font-mono text-label-md">{name}</code>
          <span className="w-10 text-label-md text-on-surface-variant">{dp}dp</span>
          <div className={twMerge(width, 'h-4 rounded-shape-xs bg-primary')} />
        </div>
      ))}
    </div>
  )
}
