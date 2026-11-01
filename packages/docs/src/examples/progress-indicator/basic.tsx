import { CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'

export default function Basic() {
  return (
    <div className="flex w-80 flex-col items-center gap-space-400">
      <LinearProgressIndicator aria-label="Loading news article" value={40} />
      <CircularProgressIndicator aria-label="Refreshing page" shape="wavy" isIndeterminate />
    </div>
  )
}
