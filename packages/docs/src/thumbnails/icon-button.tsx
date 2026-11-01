import { Icon, IconButton } from '@material-web/react'

/** Icon buttons at the corner of a screen: outlined and narrow, tonal, and filled and wide. */
export default function IconButtonThumbnail() {
  return (
    <div className="docs-thumbnail-screen me-space-500 h-42 grow basis-0 flex-row items-center justify-end gap-space-150 self-end rounded-se-shape-xl border-s-0 border-b-0 pe-space-250">
      <IconButton variant="outlined" size="m" width="narrow" aria-label="Settings">
        <Icon name="settings" />
      </IconButton>
      <IconButton variant="tonal" size="m" aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="filled" size="m" width="wide" aria-label="Send">
        <Icon name="send" />
      </IconButton>
    </div>
  )
}
