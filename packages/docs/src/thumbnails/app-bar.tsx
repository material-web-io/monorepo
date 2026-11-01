import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'
import { StatusBar } from '../components/phone'

/** An app bar at the top of a phone's screen: a title and its subtitle under two buttons. */
export default function AppBarThumbnail() {
  return (
    <div className="docs-thumbnail-screen h-44 w-64 self-end rounded-t-shape-xl border-b-0">
      <StatusBar />
      {/* Nothing in the picture scrolls, and the page's own scroll is not the bar's to fill at. */}
      <AppBar variant="medium-flexible" isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Explore Banff</Heading>
        <Text slot="subtitle">Trails, gondolas and wildlife</Text>
        <IconButton slot="trailing" variant="tonal" aria-label="Share">
          <Icon name="share" />
        </IconButton>
      </AppBar>
    </div>
  )
}
