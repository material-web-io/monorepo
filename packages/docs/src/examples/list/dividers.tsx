import { List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Dividers() {
  return (
    <List aria-label="Contacts" hasDivider className="w-90">
      <ListItem id="ali" textValue="Ali Connors">
        <Text slot="label">Ali Connors</Text>
        <Text slot="description">Brunch this weekend?</Text>
      </ListItem>
      <ListItem id="sandra" textValue="Sandra Adams">
        <Text slot="label">Sandra Adams</Text>
        <Text slot="description">Oui oui</Text>
      </ListItem>
      <ListItem id="trevor" textValue="Trevor Hansen">
        <Text slot="label">Trevor Hansen</Text>
        <Text slot="description">Birthday gift</Text>
      </ListItem>
    </List>
  )
}
