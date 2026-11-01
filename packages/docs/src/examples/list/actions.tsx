import { Icon, IconButton, List, ListItem } from '@material-web/react'
import { useState } from 'react'
import { Text } from 'react-aria-components'

const contacts = [
  { id: 'ali', name: 'Ali Connors', message: 'Brunch this weekend?' },
  { id: 'sandra', name: 'Sandra Adams', message: 'Oui oui' },
  { id: 'trevor', name: 'Trevor Hansen', message: 'Birthday gift' },
]

export default function Actions() {
  const [last, setLast] = useState('Nothing yet')
  return (
    <div className="flex w-90 flex-col gap-space-200">
      <List
        aria-label="Messages"
        variant="segmented"
        items={contacts}
        onAction={(id) => setLast(`Opened ${id}`)}
      >
        {(contact) => (
          <ListItem textValue={contact.name}>
            <Text slot="label">{contact.name}</Text>
            <Text slot="description">{contact.message}</Text>
            <IconButton
              slot="trailing"
              aria-label={`Bookmark ${contact.name}`}
              onPress={() => setLast(`Bookmarked ${contact.id}`)}
            >
              <Icon name="bookmark" />
            </IconButton>
          </ListItem>
        )}
      </List>
      <p className="m-0 text-body-md text-on-surface-variant">{last}</p>
    </div>
  )
}
