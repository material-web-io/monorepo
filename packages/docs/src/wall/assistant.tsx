import { Icon, IconButton, LoadingIndicator } from '@material-web/react'
import { Photo, Screen } from './screen'

/** A shopping assistant: what it found, a loading indicator as it thinks, over what was asked. */
export default function Assistant() {
  return (
    <Screen edge="bottom" theme="light" className="bg-linear-to-b from-surface to-primary-fixed">
      <div className="relative h-72 shrink-0">
        <div className="absolute -top-space-400 left-space-600 h-64 w-56 rounded-shape-2xl bg-surface-container-lowest p-space-200 shadow-elevation-1">
          <Photo of="/theme/color" className="size-full rounded-shape-xl" />
        </div>
        <Photo
          of="/theme/elevation"
          className="absolute -top-space-200 -right-space-300 size-36 rotate-12 rounded-shape-xl"
        />
      </div>
      <LoadingIndicator aria-label="Thinking" size={128} className="mb-space-400 self-center" />
      <div className="mx-space-200 mb-space-300 flex shrink-0 items-center gap-space-100 rounded-shape-xl bg-surface-container-lowest p-space-150 shadow-elevation-1">
        <IconButton aria-label="Add" variant="tonal" size="s">
          <Icon name="add" />
        </IconButton>
        <span className="grow text-body-lg">Find me a raincoat that still looks sharp</span>
        <IconButton aria-label="Speak">
          <Icon name="mic" />
        </IconButton>
        <IconButton aria-label="Talk live" variant="filled">
          <Icon name="graphic_eq" />
        </IconButton>
      </div>
    </Screen>
  )
}
