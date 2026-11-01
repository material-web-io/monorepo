import { ButtonGroup, Icon, IconButton } from '@material-web/react'

const styles = [
  { id: 'bold', icon: 'format_bold', label: 'Bold' },
  { id: 'italic', icon: 'format_italic', label: 'Italic' },
  { id: 'underlined', icon: 'format_underlined', label: 'Underline' },
]

export default function IconButtons() {
  return (
    <ButtonGroup
      variant="connected"
      className="w-auto"
      aria-label="Text style"
      selectionMode="multiple"
      defaultSelectedKeys={['bold']}
    >
      {styles.map(({ id, icon, label }) => (
        <IconButton key={id} id={id} variant="tonal" width="wide" aria-label={label} isSelectable>
          <Icon name={icon} />
        </IconButton>
      ))}
    </ButtonGroup>
  )
}
