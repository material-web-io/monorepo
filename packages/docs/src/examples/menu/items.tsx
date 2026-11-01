import { Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { Keyboard, MenuTrigger, Text } from 'react-aria-components'

export default function Items() {
  return (
    <MenuTrigger>
      <IconButton aria-label="Edit">
        <Icon name="edit" />
      </IconButton>
      <MenuPopover>
        <Menu>
          <MenuItem textValue="Cut">
            <Icon slot="leading" name="content_cut" />
            <Text slot="label">Cut</Text>
            <Keyboard>⌘X</Keyboard>
          </MenuItem>
          <MenuItem textValue="Copy">
            <Icon slot="leading" name="content_copy" />
            <Text slot="label">Copy</Text>
            <Text slot="description">Copies the selection</Text>
            <Keyboard>⌘C</Keyboard>
          </MenuItem>
          <MenuItem textValue="Paste">
            <Icon slot="leading" name="content_paste" />
            <Text slot="label">Paste</Text>
            <Text slot="trailing">New</Text>
          </MenuItem>
          <MenuItem textValue="Save to cloud">
            <Icon slot="leading" name="cloud" />
            <Text slot="label">Save to cloud</Text>
            <Icon slot="trailing" name="open_in_new" />
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
