import { Button, Divider, Icon, IconButton, Toolbar } from '@material-web/react'

export default function DockedSpacing() {
  return (
    <div className="flex flex-col gap-space-300">
      <Toolbar aria-label="Steps">
        <Button variant="text">Back</Button>
        <Button>Next</Button>
      </Toolbar>
      <Toolbar aria-label="Message" className="justify-center gap-x-space-400">
        <IconButton aria-label="Archive">
          <Icon name="archive" />
        </IconButton>
        <IconButton aria-label="Delete">
          <Icon name="delete" />
        </IconButton>
        <IconButton aria-label="Snooze">
          <Icon name="snooze" />
        </IconButton>
      </Toolbar>
      <Toolbar aria-label="Editing" className="flex justify-start gap-x-space-150">
        <IconButton aria-label="Undo">
          <Icon name="undo" className="rtl:icon-mirrored" />
        </IconButton>
        <IconButton aria-label="Redo">
          <Icon name="redo" className="rtl:icon-mirrored" />
        </IconButton>
        <Divider orientation="vertical" className="h-6 self-center" />
        <IconButton aria-label="Insert link">
          <Icon name="link" />
        </IconButton>
        <IconButton aria-label="Insert image">
          <Icon name="image" />
        </IconButton>
      </Toolbar>
    </div>
  )
}
