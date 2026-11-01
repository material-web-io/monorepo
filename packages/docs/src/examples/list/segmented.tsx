import { Icon, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export default function Segmented() {
  return (
    <div className="rounded-shape-xl bg-surface-container p-space-200">
      <List aria-label="Account" variant="segmented" className="w-80">
        <ListItem id="profile" textValue="Profile">
          <Icon slot="leading" name="person" />
          <Text slot="label">Profile</Text>
          <Text slot="description">Name, photo and bio</Text>
        </ListItem>
        <ListItem id="security" textValue="Security">
          <Icon slot="leading" name="lock" />
          <Text slot="label">Security</Text>
          <Text slot="description">Password and sign-in</Text>
        </ListItem>
        <ListItem id="notifications" textValue="Notifications">
          <Icon slot="leading" name="notifications" />
          <Text slot="label">Notifications</Text>
          <Text slot="description">Email and push</Text>
        </ListItem>
      </List>
    </div>
  )
}
