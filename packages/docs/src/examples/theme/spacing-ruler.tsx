import { twMerge } from '@material-web/react'

// Each step in dp, the gap to the next one as its share of the ruler, and the name the ruler
// gives it. The gaps of Space 100, the unit of the scale, are filled.
const steps: [dp: number, gap: string, name?: string][] = [
  [0, 'flex-2 bg-primary-container'],
  [2, 'flex-2 bg-primary-container', 'space-25'],
  [4, 'flex-2 bg-primary-container'],
  [6, 'flex-2 bg-primary-container'],
  [8, 'flex-2', 'space-100'],
  [10, 'flex-2'],
  [12, 'flex-2'],
  [14, 'flex-2'],
  [16, 'flex-4'],
  [20, 'flex-4'],
  [24, 'flex-8', 'space-300'],
  [32, 'flex-4'],
  [36, 'flex-4'],
  [40, 'flex-8'],
  [48, 'flex-8'],
  [56, 'flex-8'],
  [64, 'flex-8', 'space-800'],
  [72, 'flex-none'],
]

export default function SpacingRuler() {
  return (
    <div
      role="img"
      aria-label="A ruler of the spacing scale, from 0 to 72dp. The steps are 2dp apart up to 16dp, and 4dp or 8dp apart from there. It names four of them: space-25 at 2dp, space-100 at 8dp, space-300 at 24dp and space-800 at 64dp."
      tabIndex={0}
      className="focus-ring-inset max-w-full overflow-x-auto overflow-y-hidden pt-5 pb-14"
    >
      <div className="flex w-198 border-b border-outline px-space-200">
        {steps.map(([dp, gap, name]) => (
          <div key={dp} className={twMerge('relative h-space-600', gap)}>
            <div
              className={twMerge(
                'absolute top-0 left-0 border-l border-outline',
                name ? '-bottom-space-400' : 'bottom-0',
              )}
            />
            <span className="absolute bottom-full left-0 -translate-x-1/2 pb-space-50 text-label-md">
              {dp}
            </span>
            {name && (
              <code className="absolute top-full left-0 mt-space-400 -translate-x-1/2 pt-space-50 font-mono text-label-sm whitespace-nowrap text-on-surface-variant">
                {name}
              </code>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
