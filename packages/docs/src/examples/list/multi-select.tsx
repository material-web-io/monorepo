import { Checkbox, List, ListItem } from '@material-web/react'
import { useState } from 'react'
import { Text, type Selection } from 'react-aria-components'

const contacts = [
  { id: 'ali', name: 'Ali Connors', message: 'Brunch this weekend?' },
  { id: 'sandra', name: 'Sandra Adams', message: 'Oui oui' },
  { id: 'trevor', name: 'Trevor Hansen', message: 'Birthday gift' },
]

export default function MultiSelect() {
  const [selected, setSelected] = useState<Selection>(new Set(['ali']))
  return (
    <List
      aria-label="Contacts to share with"
      variant="segmented"
      className="w-90"
      selectionMode="multiple"
      selectedKeys={selected}
      onSelectionChange={setSelected}
    >
      {contacts.map((contact) => (
        <ListItem key={contact.id} id={contact.id} textValue={contact.name}>
          <Checkbox slot="selection" />
          <Text slot="label">{contact.name}</Text>
          <Text slot="description">{contact.message}</Text>
        </ListItem>
      ))}
    </List>
  )
}
