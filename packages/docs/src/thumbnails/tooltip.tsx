import { Button, Icon, IconButton } from '@material-web/react'

/**
 * Tooltips as they are shown, which they only are over what they describe: a plain one under
 * its button, and a rich one, with a title, a line and an action.
 */
export default function TooltipThumbnail() {
  return (
    <div className="flex shrink-0 items-center gap-space-200">
      <div className="flex flex-col items-center gap-space-50">
        <IconButton variant="filled" aria-label="Favorite">
          <Icon name="star" />
        </IconButton>
        <span className="rounded-shape-xs bg-inverse-surface px-space-100 py-space-50 text-body-sm text-inverse-on-surface">
          Favorite
        </span>
      </div>
      <div className="docs-thumbnail-panel w-44 items-start rounded-shape-md bg-surface-container px-space-200 pt-space-150 pb-space-50 text-body-md text-on-surface-variant shadow-elevation-2">
        <span className="pb-space-50 text-title-sm">Offline files</span>
        Starred files are kept on this device.
        <Button variant="text" className="-ms-space-150 mt-space-100">
          Learn more
        </Button>
      </div>
    </div>
  )
}
