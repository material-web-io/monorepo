import { CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'

export default function Thickness() {
  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-space-400">
      <LinearProgressIndicator aria-label="Loading, 4dp" value={40} />
      <LinearProgressIndicator aria-label="Loading, 8dp" thickness={8} value={40} />
      <LinearProgressIndicator
        aria-label="Loading, 8dp, wavy"
        thickness={8}
        shape="wavy"
        value={40}
      />
      <div className="flex gap-space-400">
        <CircularProgressIndicator aria-label="Refreshing, 4dp" value={40} />
        <CircularProgressIndicator aria-label="Refreshing, 8dp" thickness={8} value={40} />
        <CircularProgressIndicator
          aria-label="Refreshing, 8dp, wavy"
          thickness={8}
          shape="wavy"
          value={40}
        />
      </div>
    </div>
  )
}
