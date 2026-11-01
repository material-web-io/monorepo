import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

const paragraphs = Array.from({ length: 12 }, (_, index) => (
  <p key={index} className="m-0 px-space-200 py-space-100 text-body-lg">
    Lake Louise, Moraine Lake and the Icefields Parkway are a day trip from town, and the gondola up
    Sulphur Mountain runs year round.
  </p>
))

export default function Basic() {
  return (
    <div className="h-96 w-full overflow-y-auto">
      <AppBar variant="medium-flexible" scrollBehavior="exit-until-collapsed">
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline" level={2}>
          Explore Banff
        </Heading>
        <Text slot="subtitle">Hiking trails, gondolas, wildlife, and more</Text>
        <IconButton slot="trailing" variant="tonal" aria-label="Share">
          <Icon name="share" />
        </IconButton>
      </AppBar>
      {paragraphs}
    </div>
  )
}
