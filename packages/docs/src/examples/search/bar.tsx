import { Icon, IconButton, SearchField } from '@material-web/react'
import { Input } from 'react-aria-components'

const avatar = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30"><rect width="30" height="30" fill="#6750a4"/><text x="15" y="20" font-family="sans-serif" font-size="14" fill="#fff" text-anchor="middle">A</text></svg>',
)}`

export default function SearchBars() {
  return (
    <div className="flex w-full flex-col gap-space-300">
      <SearchField aria-label="Search your messages">
        <Icon slot="leading" name="search" />
        <Input placeholder="Search your messages" />
        <IconButton aria-label="Clear search">
          <Icon name="close" />
        </IconButton>
      </SearchField>
      <SearchField aria-label="Search your messages">
        <IconButton slot="leading" aria-label="Menu">
          <Icon name="menu" />
        </IconButton>
        <Input placeholder="Search your messages" />
        <IconButton slot="trailing" aria-label="Voice search">
          <Icon name="mic" />
        </IconButton>
        <IconButton slot="trailing" aria-label="Account">
          <img src={avatar} alt="" />
        </IconButton>
      </SearchField>
      <SearchField aria-label="Search your messages">
        <Input placeholder="Search your messages" />
      </SearchField>
    </div>
  )
}
