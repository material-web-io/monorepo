import { Button, twMerge } from '@material-web/react'
import { useState } from 'react'

const springs = [
  ['duration-spring-fast-spatial ease-spring-fast-spatial', 'fast-spatial'],
  ['duration-spring-default-spatial ease-spring-default-spatial', 'default-spatial'],
  ['duration-spring-slow-spatial ease-spring-slow-spatial', 'slow-spatial'],
  ['duration-spring-fast-effects ease-spring-fast-effects', 'fast-effects'],
  ['duration-spring-default-effects ease-spring-default-effects', 'default-effects'],
  ['duration-spring-slow-effects ease-spring-slow-effects', 'slow-effects'],
] as const

export default function MotionSprings() {
  const [isMoved, setMoved] = useState(false)
  return (
    <div className="flex flex-col gap-space-150">
      {springs.map(([spring, name]) => (
        <div key={name} className="flex flex-col gap-space-50">
          <code className="font-mono text-label-md text-on-surface-variant">{name}</code>
          <div className="w-64 rounded-shape-full bg-surface-container-high px-space-300">
            <div
              className={twMerge(
                spring,
                'size-6 rounded-shape-full bg-primary transition-transform',
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
