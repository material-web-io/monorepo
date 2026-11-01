import { Button, Icon, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function Colors() {
  return (
    <>
      {(['standard', 'vibrant'] as const).map((color) => (
        <MenuTrigger key={color}>
          <Button variant="tonal" className="capitalize">
            {color}
          </Button>
          <MenuPopover>
            <Menu color={color}>
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
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      ))}
    </>
  )
}
