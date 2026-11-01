import { Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function MenuButton() {
  return (
    <MenuTrigger>
      <IconButton aria-label="More options">
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover placement="bottom end">
        <Menu>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Duplicate</MenuItem>
          <MenuItem>Move to trash</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
