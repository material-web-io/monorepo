import { Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function Disabled() {
  return (
    <MenuTrigger>
      <IconButton aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <MenuPopover>
        <Menu>
          <MenuItem textValue="Undo">
            <Icon slot="leading" name="undo" className="rtl:icon-mirrored" />
            Undo
          </MenuItem>
          <MenuItem textValue="Redo" isDisabled>
            <Icon slot="leading" name="redo" className="rtl:icon-mirrored" />
            Redo
          </MenuItem>
          <MenuItem textValue="Cut">
            <Icon slot="leading" name="content_cut" />
            Cut
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
