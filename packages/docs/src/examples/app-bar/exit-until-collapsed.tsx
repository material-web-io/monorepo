import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

const paragraphs = Array.from({ length: 12 }, (_, index) => (
  <p key={index} className="m-0 px-space-200 py-space-100 text-body-lg">
    Hey! I’ve got pics and more info on our cabin for the weekend. Get ready to be impressed: it
    looks absolutely incredible from what I can see.
  </p>
))

export default function ExitUntilCollapsed() {
  return (
    <div className="h-96 overflow-y-auto">
      <AppBar variant="large-flexible" scrollBehavior="exit-until-collapsed">
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline" level={2}>
          Recap from June 12-19
        </Heading>
        <Text slot="subtitle">8 photos</Text>
        <IconButton slot="trailing" aria-label="Search">
          <Icon name="search" />
        </IconButton>
        <IconButton slot="trailing" aria-label="Favorite">
          <Icon name="favorite" />
        </IconButton>
      </AppBar>
      {paragraphs}
    </div>
  )
}
