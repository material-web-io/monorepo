import { Chip, ChipGroup, Icon, IconButton, List, ListItem, twMerge } from '@material-web/react'
import { Text } from 'react-aria-components'
import { Photo, Screen } from './screen'

const messages = [
  ['Noor Haddad', 'The lineup is out, and it is long', 'bg-tertiary text-on-tertiary'],
  ['Theo Brandt', 'Saving us a spot by the stage', 'bg-primary text-on-primary'],
  ['Iris Okafor', 'Lantern Park, Saturday at nine', 'bg-secondary text-on-secondary'],
] as const

/** A thread about a night out: who wrote what, in a segmented list, over a photo they shared. */
export default function Inbox() {
  return (
    <Screen edge="top" theme="light">
      <div className="flex shrink-0 items-center justify-between px-space-100 pt-space-100">
        <IconButton aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <ChipGroup aria-label="Thread">
          <Chip id="summary" variant="suggestion" textValue="Summarize">
            <Icon slot="leading" name="auto_awesome" />
            Summarize
          </Chip>
        </ChipGroup>
        <IconButton aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </div>
      <span className="flex shrink-0 items-center gap-space-150 px-space-300 py-space-300 text-display-sm icon-40">
        <Icon name="music_note" />
        Night market
      </span>
      <div className="shrink-0 px-space-200">
        <List aria-label="Messages" variant="segmented">
          {messages.map(([name, message, colors]) => (
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
      </div>
      <Photo of="/theme/motion" className="mx-space-200 mt-space-200 h-80 rounded-shape-xl" />
    </Screen>
  )
}
