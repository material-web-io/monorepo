import { AppBar, Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { Heading, MenuTrigger } from 'react-aria-components'

export default function AppBarWithMenu() {
  return (
    <AppBar>
      <IconButton slot="leading" aria-label="Menu">
        <Icon name="menu" />
      </IconButton>
      <Heading slot="headline" level={2}>
        Photos
      </Heading>
      <MenuTrigger>
        <IconButton slot="trailing" aria-label="Account">
          <Icon name="account_circle" />
        </IconButton>
        <MenuPopover>
          <Menu>
            <MenuItem>Profile</MenuItem>
            <MenuItem>My account</MenuItem>
            <MenuItem>Sign out</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </AppBar>
  )
}
