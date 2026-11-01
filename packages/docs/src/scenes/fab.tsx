import {
  Fab,
  Icon,
  List,
  ListItem,
  NavigationBar,
  NavigationBarItem,
  twMerge,
} from '@material-web/react'
import { Text } from 'react-aria-components'
import { PhoneBottom } from '../components/phone'

const chats = [
  ['Ali Connors', 'Brunch this weekend?', 'bg-primary text-on-primary'],
  ['Sandra Adams', 'Photos from the summer trip', 'bg-tertiary text-on-tertiary'],
  ['Trevor Hansen', 'Birthday gift ideas', 'bg-secondary text-on-secondary'],
  ['Britta Holt', 'Recipe to try on Friday', 'bg-primary text-on-primary'],
  ['Jonas Meyer', 'See you at eight', 'bg-tertiary text-on-tertiary'],
] as const

const destinations = [
  ['Chats', 'chat'],
  ['Calls', 'call'],
  ['Contacts', 'group'],
] as const

/** A FAB over a list of chats, above the app's navigation bar: the screen's main action. */
export default function FabScene() {
  return (
    <PhoneBottom>
      <div className="relative shrink-0">
        <List aria-label="Chats">
          {chats.map(([name, message, colors]) => (
            <ListItem key={name} id={name} textValue={name}>
              <span
                slot="leading"
                className={twMerge(
                  'grid size-10 place-items-center rounded-full text-title-md',
                  colors,
                )}
              >
                {name[0]}
              </span>
              <Text slot="label">{name}</Text>
              <Text slot="description">{message}</Text>
            </ListItem>
          ))}
        </List>
        <div className="absolute end-space-200 bottom-space-200">
          <Fab size="medium" color="primary" aria-label="New chat">
            <Icon name="edit" className="icon-filled" />
          </Fab>
        </div>
      </div>
      <NavigationBar>
        {destinations.map(([name, icon]) => (
          <NavigationBarItem key={name} isSelected={name === 'Chats'}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationBarItem>
        ))}
      </NavigationBar>
      <div className="flex shrink-0 bg-surface-container">
        <div className="docs-thumbnail-indicator" />
      </div>
    </PhoneBottom>
  )
}
