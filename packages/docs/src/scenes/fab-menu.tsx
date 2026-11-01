import { Button, Icon, IconButton, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'
import { PhoneBottom } from '../components/phone'

const files = [
  ['Trip plan', 'Edited yesterday', 'description'],
  ['Budget 2025', 'Edited on Monday', 'table_chart'],
  ['Photos', '48 items', 'folder'],
  ['Meeting notes', 'Edited last week', 'description'],
  ['Recipes', '12 items', 'folder'],
  ['Reading list', 'Edited in May', 'description'],
] as const

const actions = [
  ['Document', 'description'],
  ['Message', 'chat'],
  ['Folder', 'folder'],
] as const

/**
 * A FAB menu as it is open, which it only is over a page: its items, each a tonal button in the
 * menu's color, over the button that closes it, at the corner of a list of files.
 */
export default function FabMenuScene() {
  return (
    <PhoneBottom>
      <div className="relative shrink-0">
        <List aria-label="Files">
          {files.map(([name, detail, icon]) => (
            <ListItem key={name} id={name} textValue={name}>
              <Icon slot="leading" name={icon} />
              <Text slot="label">{name}</Text>
              <Text slot="description">{detail}</Text>
            </ListItem>
          ))}
        </List>
        <div className="absolute end-space-200 bottom-space-100 flex flex-col items-end gap-space-50">
          {actions.map(([action, icon]) => (
            <Button
              key={action}
              size="m"
              variant="tonal"
              className="bg-primary-container text-on-primary-container"
            >
              <Icon name={icon} />
              {action}
            </Button>
          ))}
          <IconButton variant="filled" size="m" aria-label="Close" className="mt-space-50">
            <Icon name="close" />
          </IconButton>
        </div>
      </div>
      <div className="docs-thumbnail-indicator" />
    </PhoneBottom>
  )
}
