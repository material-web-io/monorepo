import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Standard() {
  return (
    <List aria-label="Folders" variant="standard" className="w-90">
      <ListItem id="inbox" textValue="Inbox">
        <Icon slot="leading" name="inbox" />
        <Text slot="label">Inbox</Text>
        <Text slot="trailing">24</Text>
      </ListItem>
      <ListItem id="starred" textValue="Starred">
        <Icon slot="leading" name="star" />
        <Text slot="label">Starred</Text>
        <Text slot="trailing">3</Text>
      </ListItem>
      <ListItem id="sent" textValue="Sent">
        <Icon slot="leading" name="send" />
        <Text slot="label">Sent</Text>
      </ListItem>
    </List>
  )
}
