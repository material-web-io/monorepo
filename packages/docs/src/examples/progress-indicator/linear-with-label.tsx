import { LinearProgressIndicator } from '@material-web/react'
import { useId } from 'react'

export default function LinearWithLabel() {
  const id = useId()
  const value = 40
  return (
    <div className="flex w-full max-w-96 flex-col gap-space-100">
      <span id={id} className="text-label-lg">
        Downloading update
      </span>
      <div className="flex items-center gap-space-200">
        <div className="min-w-0 flex-1">
          <LinearProgressIndicator aria-labelledby={id} value={value} />
        </div>
        <span className="text-label-lg text-on-surface-variant">{value}%</span>
      </div>
    </div>
  )
}
