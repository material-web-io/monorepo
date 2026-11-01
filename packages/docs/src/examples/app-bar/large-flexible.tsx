import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function LargeFlexible() {
  return (
    <AppBar variant="large-flexible">
      <IconButton slot="leading" aria-label="Back">
        <Icon name="arrow_back" />
      </IconButton>
      <Heading slot="headline" level={2}>
        Hiking trips with Elie in Santa Monica and Joshua Tree
      </Heading>
      <IconButton slot="trailing" aria-label="Map">
        <Icon name="map" />
      </IconButton>
      <IconButton slot="trailing" aria-label="More options">
        <Icon name="more_vert" />
      </IconButton>
    </AppBar>
  )
}
