import { List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

const contacts = [
  { id: 'ali', name: 'Ali Connors', message: 'Brunch this weekend?' },
  { id: 'sandra', name: 'Sandra Adams', message: 'Oui oui' },
  { id: 'trevor', name: 'Trevor Hansen', message: 'Birthday gift' },
]

export default function Variants() {
  return (
    <>
      {(['standard', 'segmented'] as const).map((variant) => (
        <List key={variant} aria-label={`Contacts, ${variant}`} variant={variant} className="w-72">
          {contacts.map((contact) => (
            <ListItem key={contact.id} id={contact.id} textValue={contact.name}>
              <Text slot="label">{contact.name}</Text>
              <Text slot="description">{contact.message}</Text>
            </ListItem>
          ))}
        </List>
      ))}
    </>
  )
}
