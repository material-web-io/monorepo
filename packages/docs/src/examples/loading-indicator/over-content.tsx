import { LoadingIndicator } from '@material-web/react'

const episodes = ['Pilot', 'The long way home', 'Static', 'Low tide']

export default function OverContent() {
  return (
    <div className="relative w-80 rounded-shape-lg bg-surface-container-highest py-space-100">
      {episodes.map((episode, index) => (
        <div key={episode} className="flex items-center gap-space-200 px-space-200 py-space-100">
          <div className="size-14 shrink-0 rounded-shape-md bg-tertiary-container" />
          <div className="min-w-0">
            <div className="truncate text-body-lg">{episode}</div>
            <div className="text-body-md text-on-surface-variant">Episode {index + 1}</div>
          </div>
        </div>
      ))}
      <div className="absolute inset-x-0 top-space-300 flex justify-center">
        <LoadingIndicator aria-label="Refreshing my episodes" isContained />
      </div>
    </div>
  )
}
