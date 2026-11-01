import { Button, Icon, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { useState } from 'react'
import { MenuTrigger, type Key } from 'react-aria-components'

const orders = ['Name', 'Date modified', 'Size']

export default function SingleSelect() {
  const [order, setOrder] = useState<Key>('Name')
  return (
    <MenuTrigger>
      <Button variant="outlined">
        <Icon name="sort" />
        {`Sort by ${String(order).toLowerCase()}`}
      </Button>
      <MenuPopover>
        <Menu
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[order]}
          onSelectionChange={(keys) => {
            const [key] = keys === 'all' ? [] : [...keys]
            if (key !== undefined) setOrder(key)
          }}
        >
          {orders.map((name) => (
            <MenuItem key={name} id={name}>
              {name}
            </MenuItem>
          ))}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
