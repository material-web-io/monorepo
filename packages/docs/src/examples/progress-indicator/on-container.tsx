import { LinearProgressIndicator } from '@material-web/react'

export default function OnContainer() {
  return (
    <div className="w-full max-w-96 rounded-shape-lg bg-surface-container-highest">
      <div className="px-space-50 pt-space-50">
        <LinearProgressIndicator aria-label="Loading my episodes" shape="wavy" value={35} />
      </div>
      <div className="p-space-200 text-title-lg">My episodes</div>
    </div>
  )
}
