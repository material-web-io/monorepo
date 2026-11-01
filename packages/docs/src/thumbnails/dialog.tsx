import { Button } from '@material-web/react'

/**
 * A dialog as it is open, which it only is over a page: its container, with a title, a line
 * under it and its two actions.
 */
export default function DialogThumbnail() {
  return (
    <div className="docs-thumbnail-panel w-66 rounded-shape-xl bg-surface-container-high py-space-300">
      <span className="px-space-300 pb-space-200 text-headline-sm">Discard draft?</span>
      <span className="px-space-300 text-body-md text-on-surface-variant">
        Your changes will not be saved.
      </span>
      <div className="flex justify-end gap-space-100 px-space-300 pt-space-300">
        <Button variant="text">Cancel</Button>
        <Button variant="text">Discard</Button>
      </div>
    </div>
  )
}
