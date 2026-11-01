import {
  AppBar,
  Chip,
  ChipGroup,
  Fab,
  Icon,
  IconButton,
  List,
  ListItem,
  NavigationBar,
  NavigationBarItem,
} from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

const filters = ['All', 'Unread', 'Starred']

const conversations = [
  ['Ali Connors', 'Brunch this weekend?', '9:41'],
  ['Sandra Adams', 'Oui oui', '8:12'],
  ['Trevor Hansen', 'Birthday gift', 'Mon'],
] as const

const destinations = [
  ['Inbox', 'inbox'],
  ['Chats', 'chat'],
  ['Meet', 'videocam'],
] as const

/** The picture of what the project is: its components as the screen of a small mail app. */
export default function Overview() {
  return (
    <div className="docs-picture-surface flex w-90 flex-col">
      {/* Nothing in the picture scrolls, and the page's own scroll is not the bar's to fill at. */}
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Menu">
          <Icon name="menu" />
        </IconButton>
        <Heading slot="headline" level={3}>
          Inbox
        </Heading>
        <IconButton slot="trailing" aria-label="Search">
          <Icon name="search" />
        </IconButton>
      </AppBar>
      <ChipGroup
        aria-label="Show"
        selectionMode="single"
        defaultSelectedKeys={['all']}
        className="px-space-200 pt-space-100 pb-space-200"
      >
        {filters.map((filter) => (
          <Chip key={filter} id={filter.toLowerCase()} variant="filter" textValue={filter}>
            {({ isSelected }) => (
              <>
                {isSelected && <Icon slot="leading" name="check" />}
                {filter}
              </>
            )}
          </Chip>
        ))}
      </ChipGroup>
      {/* The room under the list is the button's, which stands clear of the last row. */}
      <List aria-label="Conversations" className="pb-28">
        {conversations.map(([name, subject, time]) => (
          <ListItem key={name} id={name} textValue={name}>
            <span
              slot="leading"
              aria-hidden
              className="grid size-10 place-items-center rounded-full bg-primary-container text-title-md text-on-primary-container"
            >
              {name[0]}
            </span>
            <Text slot="label">{name}</Text>
            <Text slot="description">{subject}</Text>
            <Text slot="trailing">{time}</Text>
          </ListItem>
        ))}
      </List>
      <Fab className="absolute end-space-200 bottom-20">
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
      <nav aria-label="Mail">
        <NavigationBar>
          {destinations.map(([name, icon]) => (
            <NavigationBarItem key={name} isSelected={name === 'Inbox'}>
              <Icon name={icon} />
              <Text slot="label">{name}</Text>
            </NavigationBarItem>
          ))}
        </NavigationBar>
      </nav>
    </div>
  )
}
