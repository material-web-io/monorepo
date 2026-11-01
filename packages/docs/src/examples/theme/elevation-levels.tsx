import { twMerge } from '@material-web/react'

const levels = [
  'shadow-elevation-0',
  'shadow-elevation-1',
  'shadow-elevation-2',
  'shadow-elevation-3',
  'shadow-elevation-4',
  'shadow-elevation-5',
] as const

export default function ElevationLevels() {
  return (
    <div className="grid w-full grid-cols-2 gap-space-400 p-space-200 medium-screen:grid-cols-3">
      {levels.map((level, index) => (
        <div
          key={level}
          className={twMerge(
            level,
            'flex h-24 flex-col justify-end rounded-shape-md bg-surface-container-low p-space-150',
          )}
        >
          <span className="text-title-md">Level {index}</span>
          <code className="font-mono text-label-md text-on-surface-variant">{level}</code>
        </div>
      ))}
    </div>
  )
}
