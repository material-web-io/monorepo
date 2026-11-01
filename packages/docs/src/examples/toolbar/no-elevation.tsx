import { Icon, IconButton, Toolbar } from '@material-web/react'

export default function NoElevation() {
  return (
    <div className="rounded-shape-xl bg-surface-container-highest p-space-400">
      <Toolbar variant="floating" color="vibrant" aria-label="Formatting" className="shadow-none">
        <IconButton aria-label="Bold" isSelectable defaultSelected>
          <Icon name="format_bold" />
        </IconButton>
        <IconButton aria-label="Italic" isSelectable>
          <Icon name="format_italic" />
        </IconButton>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
      </Toolbar>
    </div>
  )
}
