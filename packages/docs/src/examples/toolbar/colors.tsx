import { Icon, IconButton, Toolbar } from '@material-web/react'

const colors = ['standard', 'vibrant'] as const

export default function Colors() {
  return (
    <>
      {colors.map((color) => (
        <Toolbar key={color} variant="floating" color={color} aria-label={`Formatting, ${color}`}>
          <IconButton aria-label="Bold" isSelectable defaultSelected>
            <Icon name="format_bold" />
          </IconButton>
          <IconButton aria-label="Italic" isSelectable>
            <Icon name="format_italic" />
          </IconButton>
          <IconButton aria-label="Underline" isSelectable>
            <Icon name="format_underlined" />
          </IconButton>
          <IconButton aria-label="More">
            <Icon name="more_vert" />
          </IconButton>
        </Toolbar>
      ))}
    </>
  )
}
