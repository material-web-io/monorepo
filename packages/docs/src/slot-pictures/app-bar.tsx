import { AppBar, Icon, IconButton } from '@material-web/react'
import { Button, Heading, Text } from 'react-aria-components'
import { SlotCanvas, SlotPicture } from '../components/slot-picture'

/** The slots of an app bar: a small bar with a subtitle, and a search app bar. */
export function AppBarSlots({ showLegend }: { showLegend?: boolean }) {
  return (
    <SlotPicture
      slots={['leading', 'headline', 'subtitle', 'search', 'trailing']}
      showLegend={showLegend}
    >
      <SlotCanvas>
        {/* Nothing in the picture scrolls, and the page's own scroll is not the bar's to fill at. */}
        <AppBar isScrolled={false} className="w-90 max-w-full">
          <IconButton slot="leading" aria-label="Back">
            <Icon name="arrow_back" />
          </IconButton>
          <Heading slot="headline" level={3}>
            Explore Banff
          </Heading>
          <Text slot="subtitle">Trails and gondolas</Text>
          <IconButton slot="trailing" aria-label="Share">
            <Icon name="share" />
          </IconButton>
          <IconButton slot="trailing" aria-label="More options">
            <Icon name="more_vert" />
          </IconButton>
        </AppBar>
      </SlotCanvas>
      <SlotCanvas sides={{ search: 'bottom' }}>
        <AppBar isScrolled={false} className="w-90 max-w-full">
          <IconButton slot="leading" aria-label="Menu">
            <Icon name="menu" />
          </IconButton>
          <Button slot="search">
            <Icon slot="leading" name="search" />
            Search
          </Button>
          <span
            slot="trailing"
            className="grid size-8 place-items-center rounded-full bg-tertiary text-title-sm text-on-tertiary"
          >
            A
          </span>
        </AppBar>
      </SlotCanvas>
    </SlotPicture>
  )
}
