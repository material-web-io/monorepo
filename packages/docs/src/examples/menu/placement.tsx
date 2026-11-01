import { Button, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

const placements = ['bottom start', 'bottom end', 'top start', 'end top', 'start top'] as const

export default function Placement() {
  return (
    <>
      {placements.map((placement) => (
        <MenuTrigger key={placement}>
          <Button variant="tonal">{placement}</Button>
          <MenuPopover placement={placement}>
            <Menu>
              <MenuItem>Preview</MenuItem>
              <MenuItem>Share</MenuItem>
              <MenuItem>Get link</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      ))}
    </>
  )
}
