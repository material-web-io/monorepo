import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Horizontal() {
  return (
    <List
      aria-label="Text alignment"
      orientation="horizontal"
      variant="segmented"
      selectionMode="single"
      defaultSelectedKeys={['start']}
    >
      <ListItem id="start" textValue="Start">
        <Icon slot="leading" name="format_align_left" />
        <Text slot="label">Start</Text>
      </ListItem>
      <ListItem id="center" textValue="Center">
        <Icon slot="leading" name="format_align_center" />
        <Text slot="label">Center</Text>
      </ListItem>
      <ListItem id="end" textValue="End">
        <Icon slot="leading" name="format_align_right" />
        <Text slot="label">End</Text>
      </ListItem>
    </List>
  )
}
