import { Menu, MenuItem, MenuPopover } from '@material-web/react'
import { Button, MenuTrigger, Separator } from 'react-aria-components'

export default function Context() {
  return (
    <MenuTrigger trigger="contextMenu">
      <Button className="focus-ring box-border grid h-32 w-full max-w-80 place-items-center rounded-shape-md border border-dashed border-outline bg-transparent p-space-200 font-plain text-body-md text-on-surface-variant">
        Right-click here, or press and hold
      </Button>
      <MenuPopover>
        <Menu>
          <MenuItem>Open</MenuItem>
          <MenuItem>Rename</MenuItem>
          <MenuItem>Duplicate</MenuItem>
          <Separator />
          <MenuItem>Move to trash</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
