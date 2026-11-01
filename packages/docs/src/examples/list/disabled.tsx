import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Disabled() {
  return (
    <List
      aria-label="Contacts"
      variant="segmented"
      className="w-90"
      selectionMode="single"
      defaultSelectedKeys={['sandra']}
      disabledKeys={['sandra', 'trevor']}
    >
      <ListItem id="ali" textValue="Ali Connors">
        <Icon slot="leading" name="person" />
        <Text slot="label">Ali Connors</Text>
        <Text slot="description">Enabled</Text>
      </ListItem>
      <ListItem id="sandra" textValue="Sandra Adams">
        <Icon slot="leading" name="person" />
        <Text slot="label">Sandra Adams</Text>
        <Text slot="description">Disabled and selected</Text>
      </ListItem>
      <ListItem id="trevor" textValue="Trevor Hansen">
        <Icon slot="leading" name="person" />
        <Text slot="label">Trevor Hansen</Text>
        <Text slot="description">Disabled</Text>
      </ListItem>
    </List>
  )
}
