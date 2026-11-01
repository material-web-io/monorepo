import { AppBar, Icon, IconButton, List, ListItem, twMerge } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const messages = [
  ['Ali Connors', 'Brunch this weekend?', '9:12', 'bg-primary text-on-primary'],
  ['Sandra Adams', 'Photos from the summer trip', '8:40', 'bg-tertiary text-on-tertiary'],
  ['Trevor Hansen', 'Birthday gift ideas', 'Tue', 'bg-secondary text-on-secondary'],
  ['Britta Holt', 'Recipe to try on Friday', 'Mon', 'bg-primary text-on-primary'],
  ['Jonas Meyer', 'See you at eight', 'Sun', 'bg-tertiary text-on-tertiary'],
] as const

/** A segmented list of messages: each item a picture, a name, a line under it and a time. */
export default function ListScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <Heading slot="headline">Messages</Heading>
        <IconButton slot="trailing" aria-label="Search">
          <Icon name="search" />
        </IconButton>
      </AppBar>
      <div className="shrink-0 px-space-200">
        <List aria-label="Messages" variant="segmented">
          {messages.map(([name, message, time, colors]) => (
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
              <Text slot="trailing">{time}</Text>
            </ListItem>
          ))}
        </List>
      </div>
    </PhoneTop>
  )
}
