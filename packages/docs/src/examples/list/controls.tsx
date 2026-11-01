import { Icon, List, ListItem, Switch } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Controls() {
  return (
    <List aria-label="Settings" variant="segmented" className="w-90">
      <ListItem id="wifi" textValue="Wi-Fi">
        <Icon slot="leading" name="wifi" />
        <Text slot="label">Wi-Fi</Text>
        <Text slot="description">Home network</Text>
        <Switch slot="trailing" aria-label="Wi-Fi" defaultSelected />
      </ListItem>
      <ListItem id="bluetooth" textValue="Bluetooth">
        <Icon slot="leading" name="bluetooth" />
        <Text slot="label">Bluetooth</Text>
        <Text slot="description">Available devices</Text>
        <Switch slot="trailing" aria-label="Bluetooth" />
      </ListItem>
    </List>
  )
}
