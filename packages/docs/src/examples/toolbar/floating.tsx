import { Icon, IconButton, Toolbar } from '@material-web/react'
import { useState } from 'react'

export default function Floating() {
  const [isBold, setBold] = useState(true)
  const [isItalic, setItalic] = useState(false)
  return (
    <div className="relative h-80">
      <div className="h-full overflow-y-auto p-space-300 text-body-lg">
        <p className="m-0">
          Hey! I’ve got pics and more info on our cabin for the weekend. Get ready to be impressed:
          it looks absolutely incredible from what I can see.
        </p>
      </div>
      <Toolbar
        variant="floating"
        aria-label="Formatting"
        className="absolute bottom-space-200 left-1/2 -translate-x-1/2"
      >
        <IconButton aria-label="Bold" isSelectable isSelected={isBold} onChange={setBold}>
          <Icon name="format_bold" />
        </IconButton>
        <IconButton aria-label="Italic" isSelectable isSelected={isItalic} onChange={setItalic}>
          <Icon name="format_italic" />
        </IconButton>
        <IconButton aria-label="Text color">
          <Icon name="format_color_text" />
        </IconButton>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
      </Toolbar>
    </div>
  )
}
