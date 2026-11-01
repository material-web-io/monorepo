import { Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function Instant() {
  return (
    <MenuTrigger>
      <IconButton aria-label="More options">
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover shouldSkipAnimation>
        <Menu>
          <MenuItem>Preview</MenuItem>
          <MenuItem>Share</MenuItem>
          <MenuItem>Get link</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
