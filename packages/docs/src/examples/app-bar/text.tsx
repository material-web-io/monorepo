import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function HeadlineAndSubtitle() {
  return (
    <div className="flex flex-col gap-space-300">
      <AppBar>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline" level={2}>
          Recap from June 12-19
        </Heading>
        <Text slot="subtitle">8 photos</Text>
        <IconButton slot="trailing" aria-label="Favorite">
          <Icon name="favorite" />
        </IconButton>
      </AppBar>
      <AppBar className="text-center">
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline" level={2}>
          Recap from June 12-19
        </Heading>
        <Text slot="subtitle">8 photos</Text>
        <IconButton slot="trailing" aria-label="Favorite">
          <Icon name="favorite" />
        </IconButton>
      </AppBar>
      <AppBar variant="large-flexible" className="text-center">
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline" level={2}>
          Recap from June 12-19
        </Heading>
        <Text slot="subtitle">8 photos</Text>
        <IconButton slot="trailing" aria-label="Favorite">
          <Icon name="favorite" />
        </IconButton>
      </AppBar>
    </div>
  )
}
