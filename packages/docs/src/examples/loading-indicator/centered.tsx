import { LoadingIndicator } from '@material-web/react'

export default function Centered() {
  return (
    <div className="flex h-72 w-80 flex-col rounded-shape-lg bg-surface-container-highest">
      <div className="p-space-200 text-title-lg">My episodes</div>
      <div className="flex flex-1 items-center justify-center">
        <LoadingIndicator aria-label="Loading my episodes" />
      </div>
    </div>
  )
}
