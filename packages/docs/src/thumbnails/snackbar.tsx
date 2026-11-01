import { twMerge } from '@material-web/react'

const tiles = ['col-span-2', '', '', 'col-span-2']

/**
 * A snackbar as it is shown, which it only is for a moment: its message and its action, over
 * the content at the bottom of a phone's screen, which is only blocked in.
 */
export default function SnackbarThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-42 w-64 self-start rounded-b-shape-xl border-t-0">
      <div className="grid grow grid-cols-3 gap-space-50 p-space-50 pt-0">
        {tiles.map((span, index) => (
          <span key={index} className={twMerge('bg-surface-container-highest', span)} />
        ))}
      </div>
      <div className="absolute inset-x-space-150 bottom-space-150 flex items-center rounded-shape-xs bg-inverse-surface py-space-50 ps-space-200 pe-space-100 text-body-md text-inverse-on-surface shadow-elevation-3">
        <span className="grow py-space-125">Email archived</span>
        <span className="px-space-150 py-space-125 text-label-lg text-inverse-primary">Undo</span>
      </div>
    </div>
  )
}
