import { Button, Icon, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function Links() {
  return (
    <MenuTrigger>
      <Button variant="tonal">Read more</Button>
      <MenuPopover>
        <Menu>
          <MenuItem href="/components/fab-menu">FAB menu</MenuItem>
          <MenuItem
            textValue="Menus in Material 3"
            href="https://m3.material.io/components/menus"
            target="_blank"
            rel="noreferrer"
          >
            Menus in Material 3
            <Icon slot="trailing" name="open_in_new" />
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
