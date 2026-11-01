import { Button, Icon, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger, Separator } from 'react-aria-components'

export default function Custom() {
  return (
    <MenuTrigger>
      <Button variant="tonal">Message</Button>
      <MenuPopover>
        <Menu className="bg-surface-container-high">
          <MenuItem textValue="Star">
            {({ isFocused }) => (
              <>
                <Icon
                  slot="leading"
                  name="star"
                  className={isFocused ? 'icon-filled' : undefined}
                />
                Star
              </>
            )}
          </MenuItem>
          <MenuItem textValue="Archive">
            <Icon slot="leading" name="archive" />
            Archive
          </MenuItem>
          <Separator />
          <MenuItem textValue="Delete" className="text-error">
            <Icon slot="leading" name="delete" className="text-error" />
            Delete
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
