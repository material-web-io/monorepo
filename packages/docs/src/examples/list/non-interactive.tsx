import { List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function NonInteractive() {
  return (
    <List aria-label="Details" className="w-90">
      <ListItem id="size" textValue="Size">
        <Text slot="label">Size</Text>
        <Text slot="trailing">2.4 MB</Text>
      </ListItem>
      <ListItem id="modified" textValue="Modified">
        <Text slot="label">Modified</Text>
        <Text slot="trailing">Nov 6, 2026</Text>
      </ListItem>
      <ListItem id="owner" textValue="Owner">
        <Text slot="label">Owner</Text>
        <Text slot="trailing">Ali Connors</Text>
      </ListItem>
    </List>
  )
}
