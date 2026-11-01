import { Button, ButtonGroup, Icon, IconButton, Toolbar } from '@material-web/react'

const formats = [
  ['bold', 'Bold', 'format_bold'],
  ['italic', 'Italic', 'format_italic'],
  ['underline', 'Underline', 'format_underlined'],
] as const

const pages = ['Photos', 'Memories', 'Library']

export default function WithButtonGroup() {
  return (
    <>
      <Toolbar variant="floating" aria-label="Formatting">
        <ButtonGroup
          aria-label="Text style"
          selectionMode="multiple"
          defaultSelectedKeys={['bold']}
        >
          {formats.map(([id, label, icon]) => (
            <IconButton key={id} id={id} aria-label={label} isSelectable>
              <Icon name={icon} />
            </IconButton>
          ))}
        </ButtonGroup>
        <IconButton aria-label="More">
          <Icon name="more_vert" />
        </IconButton>
      </Toolbar>
      <Toolbar variant="floating" aria-label="Pages">
        <ButtonGroup
          aria-label="Page"
          defaultSelectedKeys={['Photos']}
          disallowEmptySelection
          className="gap-space-50"
        >
          {pages.map((name) => (
            <Button key={name} id={name} variant="tonal" isSelectable>
              {name}
            </Button>
          ))}
        </ButtonGroup>
      </Toolbar>
    </>
  )
}
