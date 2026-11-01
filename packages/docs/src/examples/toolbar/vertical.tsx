import { Icon, IconButton, Toolbar } from '@material-web/react'

const colors = ['standard', 'vibrant'] as const

export default function Vertical() {
  return (
    <>
      {colors.map((color) => (
        <Toolbar
          key={color}
          variant="floating"
          orientation="vertical"
          color={color}
          aria-label={`Call, ${color}`}
        >
          <IconButton aria-label="Camera" isSelectable defaultSelected>
            <Icon name="videocam" />
          </IconButton>
          <IconButton aria-label="Microphone" isSelectable>
            <Icon name="mic" />
          </IconButton>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
        </Toolbar>
      ))}
    </>
  )
}
