import { Icon, IconButton, SearchField } from '@material-web/react'
import { Input } from 'react-aria-components'

export default function Custom() {
  return (
    <SearchField aria-label="Search your messages" className="w-full rounded-shape-lg">
      {({ isEmpty }) => (
        <>
          <Icon slot="leading" name="search" />
          <Input placeholder="Search your messages" />
          <IconButton aria-label="Clear search">
            <Icon name="close" />
          </IconButton>
          {isEmpty && (
            <IconButton slot="trailing" aria-label="Voice search">
              <Icon name="mic" />
            </IconButton>
          )}
        </>
      )}
    </SearchField>
  )
}
