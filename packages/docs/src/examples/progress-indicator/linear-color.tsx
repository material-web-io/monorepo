import { LinearProgressIndicator } from '@material-web/react'

export default function LinearColor() {
  return (
    <div className="flex w-full max-w-96 flex-col gap-space-400">
      <LinearProgressIndicator
        aria-label="Loading, secondary"
        isIndeterminate
        className="text-secondary"
      />
      <LinearProgressIndicator
        aria-label="Loading, tertiary"
        isIndeterminate
        className="text-tertiary"
      />
      <LinearProgressIndicator aria-label="Loading, error" value={40} className="text-error" />
    </div>
  )
}
