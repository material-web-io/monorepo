import { Icon, IconButton, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Basic() {
  return (
    <List aria-label="Contacts" variant="segmented" className="w-90">
      <ListItem id="ali" textValue="Ali Connors">
        <Icon slot="leading" name="person" />
        <Text slot="overline">Favorite</Text>
        <Text slot="label">Ali Connors</Text>
        <Text slot="description">Brunch this weekend?</Text>
        <Text slot="trailing">100+</Text>
        <IconButton slot="trailing" aria-label="More options for Ali Connors">
          <Icon name="more_vert" />
        </IconButton>
      </ListItem>
      <ListItem id="sandra" textValue="Sandra Adams">
        <Icon slot="leading" name="person" />
        <Text slot="label">Sandra Adams</Text>
        <Text slot="description">Oui oui</Text>
        <Text slot="trailing">12</Text>
        <IconButton slot="trailing" aria-label="More options for Sandra Adams">
          <Icon name="more_vert" />
        </IconButton>
      </ListItem>
      <ListItem id="trevor" textValue="Trevor Hansen">
        <Icon slot="leading" name="person" />
        <Text slot="label">Trevor Hansen</Text>
        <Text slot="description">Birthday gift</Text>
        <Text slot="trailing">3</Text>
        <IconButton slot="trailing" aria-label="More options for Trevor Hansen">
          <Icon name="more_vert" />
        </IconButton>
      </ListItem>
    </List>
  )
}
