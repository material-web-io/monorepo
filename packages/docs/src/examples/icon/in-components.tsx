import { Button, Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function InComponents() {
  return (
    <>
      <Button>
        <Icon name="add" />
        Create
      </Button>
      <Button size="l">
        <Icon name="add" />
        Create
      </Button>
      <List aria-label="Folders" selectionMode="single" defaultSelectedKeys={['inbox']}>
        <ListItem id="inbox" textValue="Inbox">
          <Icon slot="leading" name="inbox" />
          <Text slot="label">Inbox</Text>
        </ListItem>
        <ListItem id="sent" textValue="Sent">
          <Icon slot="leading" name="send" />
          <Text slot="label">Sent</Text>
        </ListItem>
      </List>
    </>
  )
}
