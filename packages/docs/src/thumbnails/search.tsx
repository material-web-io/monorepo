import { Icon, IconButton, SearchField } from '@material-web/react'
import { Input } from 'react-aria-components'
import { StatusBar } from '../components/phone'

/** A search bar at the top of a phone's screen. */
export default function SearchThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-40 w-64 self-end rounded-t-shape-xl border-b-0">
      <StatusBar />
      {/* The bar is as wide as what it is in at least: the room around it is that box's. */}
      <div className="px-space-200 pt-space-150">
        <SearchField aria-label="Search your messages">
          <Icon slot="leading" name="search" />
          <Input placeholder="Search mail" />
          <IconButton slot="trailing" aria-label="Voice search">
            <Icon name="mic" />
          </IconButton>
        </SearchField>
      </div>
    </div>
  )
}
