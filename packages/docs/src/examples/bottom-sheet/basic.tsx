import { BottomSheet, Button, Icon, List, ListItem, SheetTrigger } from '@material-web/react'
import { Text } from 'react-aria-components'

const actions = [
  ['Share', 'share'],
  ['Get link', 'link'],
  ['Edit name', 'edit'],
  ['Delete collection', 'delete'],
] as const

export default function Basic() {
  return (
    <SheetTrigger>
      <Button variant="tonal">Show actions</Button>
      <BottomSheet isModal aria-label="Collection actions">
        {({ state }) => (
          <List aria-label="Collection actions" className="pb-space-200">
            {actions.map(([name, icon]) => (
              <ListItem
                key={name}
                id={name}
                textValue={name}
                className="bg-transparent"
                onAction={() => state.close()}
              >
                <Icon slot="leading" name={icon} />
                <Text slot="label">{name}</Text>
              </ListItem>
            ))}
          </List>
        )}
      </BottomSheet>
    </SheetTrigger>
  )
}
