import { Button, Icon, IconButton, Toolbar } from '@material-web/react'

export default function Emphasis() {
  return (
    <>
      <Toolbar variant="floating" aria-label="Browser">
        <IconButton aria-label="Back">
          <Icon name="arrow_back" className="rtl:icon-mirrored" />
        </IconButton>
        <IconButton aria-label="Forward">
          <Icon name="arrow_forward" className="rtl:icon-mirrored" />
        </IconButton>
        <IconButton aria-label="New tab" variant="filled" width="wide">
          <Icon name="add" />
        </IconButton>
        <IconButton aria-label="Tabs">
          <Icon name="tab" />
        </IconButton>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
      </Toolbar>
      <Toolbar variant="floating" aria-label="Draft">
        <IconButton aria-label="Attach a file">
          <Icon name="attach_file" />
        </IconButton>
        <IconButton aria-label="Insert image">
          <Icon name="image" />
        </IconButton>
        <Button variant="text">Send</Button>
      </Toolbar>
    </>
  )
}
