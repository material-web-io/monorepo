import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

/** An app bar at the top of an article: its title and subtitle under a way back and an action. */
export default function AppBarScene() {
  return (
    <PhoneTop>
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
      <svg
        aria-hidden="true"
        viewBox="0 0 336 160"
        className="mx-space-200 mt-space-100 block h-40 shrink-0 rounded-shape-lg bg-tertiary-container"
      >
        <circle cx="262" cy="46" r="20" className="fill-tertiary" />
        <path d="M0 140 96 62 160 112 212 80 336 148V160H0Z" className="fill-tertiary" />
      </svg>
      <p className="m-0 px-space-200 pt-space-200 text-body-lg">
        Lake Louise, Moraine Lake and the Icefields Parkway are a day trip from town, and the
        gondola up Sulphur Mountain runs year round.
      </p>
    </PhoneTop>
  )
}
