import { CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'
import { useEffect, useState } from 'react'

// The loop, each for its time in ms: indeterminate; at 100%, which fills from 0 once the cycle
// has run out (up to 2.2s for a linear one) and settles in 1.3s; at 0% until the track is
// empty and a moment more. One change of value for each, so that each is one smooth move.
const phases = [
  { isIndeterminate: true, value: 0, duration: 5000 },
  { isIndeterminate: false, value: 100, duration: 2300 },
  { isIndeterminate: false, value: 0, duration: 1000 },
]

/**
 * Two circular indicators in a row over two linear ones, flat and wavy, on the card's ground,
 * softened by a veil of the surface for indicators as slight as these. Each is indeterminate
 * a while, then fills from 0% to 100%, goes back to 0%, and is indeterminate again, over and
 * over.
 */
export default function ProgressIndicatorThumbnail() {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setPhase((phase + 1) % phases.length), phases[phase]!.duration)
    return () => clearTimeout(timer)
  }, [phase])
  const { isIndeterminate, value } = phases[phase]!

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-space-400 bg-surface/30">
      <div className="flex shrink-0 gap-space-500">
        <CircularProgressIndicator
          aria-label="Progress"
          isIndeterminate={isIndeterminate}
          value={value}
        />
        <CircularProgressIndicator
          aria-label="Progress"
          shape="wavy"
          isIndeterminate={isIndeterminate}
          value={value}
        />
      </div>
      <div className="flex w-60 shrink-0 flex-col gap-space-300">
        <LinearProgressIndicator
          aria-label="Progress"
          shape="wavy"
          isIndeterminate={isIndeterminate}
          value={value}
        />
        <LinearProgressIndicator
          aria-label="Progress"
          isIndeterminate={isIndeterminate}
          value={value}
        />
      </div>
    </div>
  )
}
