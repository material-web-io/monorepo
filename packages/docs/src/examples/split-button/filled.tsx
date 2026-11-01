import {
  Menu,
  MenuItem,
  MenuPopover,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function Filled() {
  return (
    <SplitButton variant="filled">
      <SplitButtonLeading>Reply</SplitButtonLeading>
      <MenuTrigger>
        <SplitButtonTrailing aria-label="More reply options" />
        <MenuPopover>
          <Menu>
            <MenuItem>Reply all</MenuItem>
            <MenuItem>Forward</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </SplitButton>
  )
}
