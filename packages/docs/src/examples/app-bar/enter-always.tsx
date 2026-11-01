import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading } from 'react-aria-components'

const paragraphs = Array.from({ length: 12 }, (_, index) => (
  <p key={index} className="m-0 px-space-200 py-space-100 text-body-lg">
    Hey! I’ve got pics and more info on our cabin for the weekend. Get ready to be impressed: it
    looks absolutely incredible from what I can see.
  </p>
))

export default function EnterAlways() {
  return (
    <div className="h-80 overflow-y-auto">
      <AppBar scrollBehavior="enter-always">
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline" level={2}>
          Aki Aro
        </Heading>
        <IconButton slot="trailing" aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </AppBar>
      {paragraphs}
    </div>
  )
}
