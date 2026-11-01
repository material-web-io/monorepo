import { Icon, IconButton, Menu, MenuItem, MenuPopover, Toolbar } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function OverflowMenu() {
  return (
    <Toolbar variant="floating" aria-label="Message">
      <IconButton aria-label="Archive">
        <Icon name="archive" />
      </IconButton>
      <IconButton aria-label="Delete">
        <Icon name="delete" />
      </IconButton>
      <MenuTrigger>
        <IconButton aria-label="More actions">
          <Icon name="more_vert" />
        </IconButton>
        <MenuPopover>
          <Menu>
            <MenuItem>Mark as unread</MenuItem>
            <MenuItem>Snooze</MenuItem>
            <MenuItem>Move to</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </Toolbar>
  )
}
