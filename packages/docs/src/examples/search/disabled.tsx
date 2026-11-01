import { Icon, IconButton, SearchField } from '@material-web/react'
import { Input } from 'react-aria-components'

export default function Disabled() {
  return (
    <SearchField
      aria-label="Search your messages"
      defaultValue="Weekend hike"
      isDisabled
      className="w-full"
    >
      <IconButton slot="leading" aria-label="Menu">
        <Icon name="menu" />
      </IconButton>
      <Input placeholder="Search your messages" />
      <IconButton aria-label="Clear search">
        <Icon name="close" />
      </IconButton>
      <IconButton slot="trailing" aria-label="Voice search">
        <Icon name="mic" />
      </IconButton>
    </SearchField>
  )
}
