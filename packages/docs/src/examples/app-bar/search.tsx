import { AppBar, Icon, IconButton } from '@material-web/react'
import { Button } from 'react-aria-components'

export default function SearchAppBar() {
  return (
    <AppBar className="text-center">
      <IconButton slot="leading" aria-label="Menu">
        <Icon name="menu" />
      </IconButton>
      <Button slot="search">
        <Icon slot="leading" name="search" />
        Search product
        <Icon slot="trailing" name="mic" className="icon-filled" />
      </Button>
      <span
        slot="trailing"
        role="img"
        aria-label="Account"
        className="grid size-8 place-items-center rounded-full bg-primary text-title-md text-on-primary"
      >
        A
      </span>
    </AppBar>
  )
}
