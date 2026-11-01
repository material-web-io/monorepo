import { AppBar, Icon, IconButton } from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function LeadingAndTrailing() {
  return (
    <div className="flex flex-col gap-space-300">
      <AppBar>
        <Heading slot="headline" level={2}>
          Inbox
        </Heading>
        <IconButton slot="trailing" aria-label="Search">
          <Icon name="search" />
        </IconButton>
      </AppBar>
      <AppBar>
        <IconButton slot="leading" aria-label="Menu">
          <Icon name="menu" />
        </IconButton>
        <Heading slot="headline" level={2}>
          Inbox
        </Heading>
        <IconButton slot="trailing" aria-label="Search">
          <Icon name="search" />
        </IconButton>
        <IconButton slot="trailing" aria-label="Today">
          <Icon name="event" />
        </IconButton>
        <span
          slot="trailing"
          role="img"
          aria-label="Account"
          className="grid size-8 place-items-center rounded-full bg-primary text-title-md text-on-primary"
        >
          A
        </span>
      </AppBar>
      <AppBar>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline" level={2}>
          New message
        </Heading>
        <IconButton slot="trailing" variant="filled" aria-label="Send">
          <Icon name="send" className="icon-filled" />
        </IconButton>
      </AppBar>
    </div>
  )
}
