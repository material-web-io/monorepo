import {
  Icon,
  List,
  ListItem,
  NavigationBar,
  NavigationBarItem,
  twMerge,
} from '@material-web/react'
import { Text } from 'react-aria-components'
import { PhoneBottom } from '../components/phone'

const mail = [
  ['Sandra Adams', 'Photos from the summer trip', 'bg-tertiary text-on-tertiary'],
  ['Trevor Hansen', 'Birthday gift ideas', 'bg-secondary text-on-secondary'],
  ['Britta Holt', 'Recipe to try on Friday', 'bg-primary text-on-primary'],
  ['Jonas Meyer', 'Your order has shipped', 'bg-tertiary text-on-tertiary'],
  ['Mina Park', 'Notes from the review', 'bg-secondary text-on-secondary'],
] as const

const destinations = [
  ['Mail', 'mail'],
  ['Chat', 'chat'],
  ['Meet', 'videocam'],
] as const

/**
 * A snackbar as it is shown, which it only is for a moment: its message, its action and its
 * close button, over a list of mail, above the app's navigation bar.
 */
export default function SnackbarScene() {
  return (
    <PhoneBottom>
      <div className="relative shrink-0 pb-space-900">
        <List aria-label="Inbox">
          {mail.map(([name, subject, colors]) => (
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
              <Text slot="description">{subject}</Text>
            </ListItem>
          ))}
        </List>
        <div className="absolute inset-x-space-200 bottom-space-200 flex items-center rounded-shape-xs bg-inverse-surface py-space-50 ps-space-200 pe-space-150 text-body-md text-inverse-on-surface shadow-elevation-3 icon-24">
          <span className="grow py-space-125">Email archived</span>
          <span className="px-space-150 py-space-125 text-label-lg text-inverse-primary">Undo</span>
          <Icon name="close" />
        </div>
      </div>
      <NavigationBar>
        {destinations.map(([name, icon]) => (
          <NavigationBarItem key={name} isSelected={name === 'Mail'}>
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
