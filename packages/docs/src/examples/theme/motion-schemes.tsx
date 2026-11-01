import { Button, twMerge } from '@material-web/react'
import { useState } from 'react'

const schemes = [
  ['expressive', 'data-motion="expressive"'],
  ['standard', 'data-motion="standard"'],
] as const

export default function MotionSchemes() {
  const [isMoved, setMoved] = useState(false)
  return (
    <div className="flex flex-col gap-space-150">
      {schemes.map(([scheme, name]) => (
        <div key={scheme} data-motion={scheme} className="flex flex-col gap-space-50">
          <code className="font-mono text-label-md text-on-surface-variant">{name}</code>
          <div className="w-64 rounded-shape-full bg-surface-container-high px-space-300">
            <div
              className={twMerge(
                'size-6 rounded-shape-full bg-primary transition-transform duration-spring-fast-spatial ease-spring-fast-spatial',
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
