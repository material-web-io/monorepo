import { CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'

export default function Shapes() {
  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-space-400">
      <LinearProgressIndicator aria-label="Loading, flat" shape="flat" value={40} />
      <LinearProgressIndicator aria-label="Loading, wavy" shape="wavy" value={40} />
      <LinearProgressIndicator aria-label="Loading, wavy" shape="wavy" isIndeterminate />
      <div className="flex gap-space-400">
        <CircularProgressIndicator aria-label="Refreshing, flat" shape="flat" value={40} />
        <CircularProgressIndicator aria-label="Refreshing, wavy" shape="wavy" value={40} />
        <CircularProgressIndicator aria-label="Refreshing, wavy" shape="wavy" isIndeterminate />
      </div>
    </div>
  )
}
