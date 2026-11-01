import { Icon, IconButton, SearchField } from '@material-web/react'
import { Input } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of a search bar: a menu button before the input, and two buttons after it. */
export function SearchFieldSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture slots={['leading', 'trailing']} showLegend={showLegend}>
      <SlotCanvas>
        <SearchField aria-label="Search your messages" className="w-90 max-w-full">
          <IconButton slot="leading" aria-label="Menu">
            <Icon name="menu" />
          </IconButton>
          <Input placeholder="Search" />
          <IconButton slot="trailing" aria-label="Voice search">
            <Icon name="mic" />
          </IconButton>
          <span
            slot="trailing"
            className="grid size-8 place-items-center rounded-full bg-tertiary text-title-sm text-on-tertiary"
          >
            A
          </span>
        </SearchField>
      </SlotCanvas>
    </SlotPicture>
  )
}
