import { Fab, Icon, IconButton, Toolbar } from '@material-web/react'

const actions = [
  ['Archive', 'archive'],
  ['Delete', 'delete'],
  ['Mark as unread', 'mark_email_unread'],
] as const

/** A floating toolbar beside a FAB, at the bottom of a phone's screen. */
export default function ToolbarThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-42 w-64 justify-end self-start rounded-b-shape-xl border-t-0">
      <div className="flex items-center justify-center gap-space-100 pb-space-100">
        <Toolbar variant="floating" color="vibrant" aria-label="Message">
          {actions.map(([action, icon]) => (
            <IconButton key={action} aria-label={action}>
              <Icon name={icon} />
            </IconButton>
          ))}
        </Toolbar>
        <Fab color="tertiary-container" aria-label="Reply">
          <Icon name="reply" />
        </Fab>
      </div>
      <div className="docs-thumbnail-indicator" />
    </div>
  )
}
