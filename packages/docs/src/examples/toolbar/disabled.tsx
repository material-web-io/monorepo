import { Icon, IconButton, Toolbar } from '@material-web/react'

const colors = ['standard', 'vibrant'] as const

export default function Disabled() {
  return (
    <>
      {colors.map((color) => (
        <Toolbar key={color} variant="floating" color={color} aria-label={`Call, ${color}`}>
          <IconButton aria-label="Turn camera on">
            <Icon name="videocam_off" />
          </IconButton>
          <IconButton aria-label="Mute" isDisabled>
            <Icon name="mic" />
          </IconButton>
          <IconButton aria-label="Captions" isSelectable defaultSelected isDisabled>
            <Icon name="closed_caption" className="icon-filled" />
          </IconButton>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
        </Toolbar>
      ))}
    </>
  )
}
