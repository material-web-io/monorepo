import { Fab, Icon, IconButton, Toolbar } from '@material-web/react'

export default function WithFab() {
  return (
    <div className="flex items-center gap-space-100">
      <Toolbar variant="floating" aria-label="Call">
        <IconButton aria-label="Turn camera on">
          <Icon name="videocam_off" />
        </IconButton>
        <IconButton aria-label="Mute">
          <Icon name="mic" />
        </IconButton>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
      </Toolbar>
      <Fab aria-label="Reply" color="tertiary-container">
        <Icon name="reply" className="rtl:icon-mirrored" />
      </Fab>
    </div>
  )
}
