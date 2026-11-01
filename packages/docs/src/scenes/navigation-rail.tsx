import {
  Fab,
  Icon,
  IconButton,
  List,
  ListItem,
  NavigationRail,
  NavigationRailHeader,
  NavigationRailItem,
  twMerge,
} from '@material-web/react'
import { Text } from 'react-aria-components'

const destinations = [
  ['Inbox', 'inbox'],
  ['Sent', 'send'],
  ['Starred', 'star'],
  ['Drafts', 'draft'],
] as const

const mail = [
  ['Ali Connors', 'Brunch this weekend?', 'bg-primary text-on-primary'],
  ['Sandra Adams', 'Photos from the summer trip', 'bg-tertiary text-on-tertiary'],
  ['Trevor Hansen', 'Birthday gift ideas', 'bg-secondary text-on-secondary'],
  ['Britta Holt', 'Recipe to try on Friday', 'bg-primary text-on-primary'],
  ['Jonas Meyer', 'Your order has shipped', 'bg-tertiary text-on-tertiary'],
  ['Mina Park', 'Notes from the review', 'bg-secondary text-on-secondary'],
] as const

/** A navigation rail down the side of a tablet's screen, beside the mail of its first destination. */
export default function NavigationRailScene() {
  return (
    <div className="docs-device ms-space-300 -me-space-100 mt-space-500 grow flex-row rounded-ss-shape-xl-inc border-s-8 border-t-8">
      <NavigationRail>
        <NavigationRailHeader>
          <IconButton aria-label="Expand">
            <Icon name="menu" />
          </IconButton>
          <Fab isExtended={false} aria-label="Compose">
            <Icon name="edit" className="icon-filled" />
            <Text slot="label">Compose</Text>
          </Fab>
        </NavigationRailHeader>
        {destinations.map(([name, icon]) => (
          <NavigationRailItem key={name} isSelected={name === 'Inbox'}>
            <Icon name={icon} />
            <Text slot="label">{name}</Text>
          </NavigationRailItem>
        ))}
      </NavigationRail>
      <div className="flex min-w-0 grow flex-col pe-space-200 pt-space-300">
        <span className="px-space-200 pb-space-200 text-headline-sm">Inbox</span>
        <List aria-label="Inbox" variant="segmented">
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
      </div>
    </div>
  )
}
