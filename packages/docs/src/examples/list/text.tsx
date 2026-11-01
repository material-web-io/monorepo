import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function TextSlots() {
  return (
    <List aria-label="Inbox" variant="segmented" className="w-90">
      <ListItem id="label">Label text alone</ListItem>
      <ListItem id="one" textValue="One line">
        <Icon slot="leading" name="mail" />
        <Text slot="label">One line</Text>
        <Text slot="trailing">100+</Text>
      </ListItem>
      <ListItem id="two" textValue="Two lines">
        <Icon slot="leading" name="mail" />
        <Text slot="label">Two lines</Text>
        <Text slot="description">Supporting text under the label</Text>
        <Text slot="trailing">100+</Text>
      </ListItem>
      <ListItem id="three" textValue="Three lines">
        <Icon slot="leading" name="mail" />
        <Text slot="overline">Overline</Text>
        <Text slot="label">Three lines</Text>
        <Text slot="description">Supporting text under the label</Text>
        <Text slot="trailing">100+</Text>
      </ListItem>
      <ListItem id="wrapped" textValue="A wrapping line">
        <Icon slot="leading" name="mail" />
        <Text slot="label">A wrapping line</Text>
        <Text slot="description">
          Supporting text that is long enough to wrap adds its lines to the item
        </Text>
      </ListItem>
    </List>
  )
}
