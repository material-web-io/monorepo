import { Button, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { useState } from 'react'
import { MenuTrigger, type Key } from 'react-aria-components'

export default function Actions() {
  const [action, setAction] = useState<Key | null>(null)
  return (
    <>
      <MenuTrigger>
        <Button variant="tonal">Edit</Button>
        <MenuPopover>
          <Menu onAction={setAction}>
            <MenuItem id="cut">Cut</MenuItem>
            <MenuItem id="copy">Copy</MenuItem>
            <MenuItem id="paste">Paste</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
      <span className="text-body-md text-on-surface-variant">
        {action ? `Last action: ${action}` : 'No action yet'}
      </span>
    </>
  )
}
