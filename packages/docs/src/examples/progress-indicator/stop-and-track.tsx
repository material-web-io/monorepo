import { LinearProgressIndicator } from '@material-web/react'

export default function StopAndTrack() {
  return (
    <div className="flex w-full max-w-96 flex-col gap-space-400">
      <LinearProgressIndicator aria-label="Loading news article" value={40} />
      <LinearProgressIndicator
        aria-label="Loading, no stop indicator"
        value={40}
        showStopIndicator={false}
      />
      <LinearProgressIndicator aria-label="Loading, no track" value={40} showTrack={false} />
    </div>
  )
}
