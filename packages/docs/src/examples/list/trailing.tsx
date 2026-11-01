import { Icon, IconButton, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Trailing() {
  return (
    <List aria-label="Downloads" variant="segmented" className="w-90">
      <ListItem id="text" textValue="Trailing text">
        <Text slot="label">Trailing text</Text>
        <Text slot="trailing">2.4 MB</Text>
      </ListItem>
      <ListItem id="icon" textValue="Trailing icon">
        <Text slot="label">Trailing icon</Text>
        <Icon slot="trailing" name="chevron_right" className="rtl:icon-mirrored" />
      </ListItem>
      <ListItem id="buttons" textValue="Trailing icon buttons">
        <Text slot="label">Trailing icon buttons</Text>
        <Text slot="trailing">2.4 MB</Text>
        <IconButton slot="trailing" aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <IconButton slot="trailing" aria-label="Delete">
          <Icon name="delete" />
        </IconButton>
      </ListItem>
    </List>
  )
}
