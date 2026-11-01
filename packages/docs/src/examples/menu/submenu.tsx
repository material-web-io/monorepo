import { Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { Keyboard, MenuTrigger, Separator, SubmenuTrigger, Text } from 'react-aria-components'

export default function Submenu() {
  return (
    <MenuTrigger>
      <IconButton aria-label="More options">
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover>
        <Menu>
          <MenuItem textValue="Share">
            <Icon slot="leading" name="person_add" />
            <Text slot="label">Share</Text>
            <Keyboard>⌘S</Keyboard>
          </MenuItem>
          <SubmenuTrigger>
            <MenuItem textValue="Move to">
              <Icon slot="leading" name="drive_file_move" />
              Move to
            </MenuItem>
            <MenuPopover>
              <Menu>
                <MenuItem>Archive</MenuItem>
                <MenuItem>Spam</MenuItem>
                <SubmenuTrigger>
                  <MenuItem>Labels</MenuItem>
                  <MenuPopover>
                    <Menu>
                      <MenuItem>Personal</MenuItem>
                      <MenuItem>Work</MenuItem>
                    </Menu>
                  </MenuPopover>
                </SubmenuTrigger>
              </Menu>
            </MenuPopover>
          </SubmenuTrigger>
          <Separator />
          <MenuItem textValue="Remove">
            <Icon slot="leading" name="delete" />
            Remove
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
