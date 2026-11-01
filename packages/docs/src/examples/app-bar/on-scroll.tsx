import { AppBar, Icon, IconButton } from '@material-web/react'
import { Button, Heading } from 'react-aria-components'

export default function OnScroll() {
  return (
    <div className="flex flex-col gap-space-300">
      {[false, true].map((isScrolled) => (
        <AppBar key={String(isScrolled)} isScrolled={isScrolled}>
          <IconButton slot="leading" aria-label="Back">
            <Icon name="arrow_back" />
          </IconButton>
          <Heading slot="headline" level={2}>
            {isScrolled ? 'On scroll' : 'Flat'}
          </Heading>
          <IconButton slot="trailing" aria-label="Search">
            <Icon name="search" />
          </IconButton>
        </AppBar>
      ))}
      <AppBar isScrolled className="text-center">
        <IconButton slot="leading" aria-label="Menu">
          <Icon name="menu" />
        </IconButton>
        <Button slot="search">Search product</Button>
      </AppBar>
    </div>
  )
}
