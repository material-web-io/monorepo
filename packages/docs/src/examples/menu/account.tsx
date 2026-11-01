import { Icon, IconButton, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger, Separator, Text } from 'react-aria-components'

const accounts = [
  ['Britta Holt', 'britta@example.com'],
  ['Jonas Meyer', 'jonas@example.com'],
] as const

export default function Account() {
  return (
    <MenuTrigger>
      <IconButton variant="tonal" aria-label="Account">
        <Icon name="account_circle" />
      </IconButton>
      <MenuPopover placement="bottom end">
        <Menu>
          {accounts.map(([name, email]) => (
            <MenuItem key={email} textValue={name}>
              <span
                slot="leading"
                className="grid size-8 place-items-center rounded-full bg-primary text-label-lg text-on-primary"
              >
                {name[0]}
              </span>
              <Text slot="label">{name}</Text>
              <Text slot="description">{email}</Text>
            </MenuItem>
          ))}
          <Separator />
          <MenuItem textValue="Add another account">
            <Icon slot="leading" name="person_add" />
            Add another account
          </MenuItem>
          <MenuItem textValue="Sign out">
            <Icon slot="leading" name="logout" />
            Sign out
          </MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
