import { Icon, IconButton, List, ListItem, SearchField } from '@material-web/react'
import { Input, Text } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const searches = [
  ['Peanut butter recipes', 'history'],
  ['Pet adoption', 'history'],
  ['Movie marathon', 'history'],
  ['Weekend hike', 'search'],
  ['Book club', 'search'],
] as const

/** A search bar at the top of a phone's screen, over the searches made before. */
export default function SearchScene() {
  return (
    <PhoneTop>
      {/* The bar is as wide as what it is in at least: the room around it is that box's. */}
      <div className="shrink-0 px-space-200 pt-space-150">
        <SearchField aria-label="Search your messages">
          <Icon slot="leading" name="search" />
          <Input placeholder="Search your messages" />
          <IconButton slot="trailing" aria-label="Voice search">
            <Icon name="mic" />
          </IconButton>
        </SearchField>
      </div>
      <span className="px-space-300 pt-space-300 pb-space-50 text-title-sm text-on-surface-variant">
        Recent searches
      </span>
      <List aria-label="Recent searches">
        {searches.map(([search, icon]) => (
          <ListItem key={search} id={search} textValue={search}>
            <Icon slot="leading" name={icon} />
            <Text slot="label">{search}</Text>
          </ListItem>
        ))}
      </List>
    </PhoneTop>
  )
}
