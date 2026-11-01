import { Icon, IconButton, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Slots() {
  return (
    <List aria-label="Contacts" variant="segmented" className="w-80">
      <ListItem id="ada" textValue="Ada Lovelace">
        <Icon slot="leading" name="person" />
        <Text slot="label">Ada Lovelace</Text>
        <Text slot="description">Mathematician</Text>
        <IconButton slot="trailing" aria-label="Call Ada Lovelace">
          <Icon name="call" />
        </IconButton>
      </ListItem>
      <ListItem id="alan" textValue="Alan Turing">
        <Icon slot="leading" name="person" />
        <Text slot="label">Alan Turing</Text>
        <Text slot="description">Computer scientist</Text>
        <IconButton slot="trailing" aria-label="Call Alan Turing">
          <Icon name="call" />
        </IconButton>
      </ListItem>
    </List>
  )
}
