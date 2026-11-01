import { Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger, Separator } from 'react-aria-components'

export default function Basic() {
  return (
    <MenuTrigger>
      <IconButton aria-label="More options">
        <Icon name="more_vert" />
      </IconButton>
      <MenuPopover>
        <Menu>
          <MenuItem textValue="Preview">
            <Icon slot="leading" name="visibility" />
            Preview
          </MenuItem>
          <MenuItem textValue="Share">
            <Icon slot="leading" name="person_add" />
            Share
          </MenuItem>
          <MenuItem textValue="Get link">
            <Icon slot="leading" name="link" />
            Get link
          </MenuItem>
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
