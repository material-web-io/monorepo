import { List, ListItem } from '@material-web/react'
import { useState } from 'react'
import type { Selection } from 'react-aria-components'

const files = [
  { id: 'report', name: 'Annual report' },
  { id: 'budget', name: 'Budget' },
  { id: 'notes', name: 'Meeting notes' },
]

export default function Collections() {
  const [selected, setSelected] = useState<Selection>(new Set(['budget']))
  return (
    <List
      aria-label="Files"
      variant="segmented"
      className="w-80"
      items={files}
      selectionMode="multiple"
      selectedKeys={selected}
      onSelectionChange={setSelected}
    >
      {(file) => <ListItem>{file.name}</ListItem>}
    </List>
  )
}
