import { Button, ButtonGroup, Icon } from '@material-web/react'
import { useState } from 'react'
import type { Key } from 'react-aria-components'

const alignments = [
  { id: 'left', icon: 'format_align_left', label: 'Align left' },
  { id: 'center', icon: 'format_align_center', label: 'Align center' },
  { id: 'right', icon: 'format_align_right', label: 'Align right' },
]

export default function Single() {
  const [selected, setSelected] = useState(new Set<Key>(['left']))
  return (
    <ButtonGroup
      variant="connected"
      size="m"
      className="w-auto"
      aria-label="Text alignment"
      disallowEmptySelection
      selectedKeys={selected}
      onSelectionChange={setSelected}
    >
      {alignments.map(({ id, icon, label }) => (
        <Button key={id} id={id} size="m" variant="outlined" aria-label={label} isSelectable>
          <Icon name={icon} className={selected.has(id) ? 'icon-filled' : undefined} />
        </Button>
      ))}
    </ButtonGroup>
  )
}
