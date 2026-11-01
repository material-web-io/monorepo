import { Button, twMerge } from '@material-web/react'
import { useState } from 'react'

const easings = [
  ['ease-standard', 'ease-standard'],
  ['ease-standard-accelerate', 'ease-standard-accelerate'],
  ['ease-standard-decelerate', 'ease-standard-decelerate'],
  ['ease-emphasized', 'ease-emphasized'],
  ['ease-emphasized-accelerate', 'ease-emphasized-accelerate'],
  ['ease-emphasized-decelerate', 'ease-emphasized-decelerate'],
  ['ease-linear', 'ease-linear'],
] as const

export default function MotionEasing() {
  const [isMoved, setMoved] = useState(false)
  return (
    <div className="flex flex-col gap-space-150">
      {easings.map(([easing, name]) => (
        <div key={name} className="flex flex-col gap-space-50">
          <code className="font-mono text-label-md text-on-surface-variant">{name}</code>
          <div className="w-64 rounded-shape-full bg-surface-container-high">
            <div
              className={twMerge(
                easing,
                'size-6 rounded-shape-full bg-tertiary transition-transform duration-long-2',
                isMoved ? 'translate-x-58' : '',
              )}
            />
          </div>
        </div>
      ))}
      <Button variant="tonal" className="self-start" onPress={() => setMoved(!isMoved)}>
        Move
      </Button>
    </div>
  )
}
