import {
  Menu,
  MenuItem,
  MenuPopover,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function Colors() {
  return (
    <SplitButton variant="tonal">
      <SplitButtonLeading className="bg-tertiary-container text-on-tertiary-container">
        Reply
      </SplitButtonLeading>
      <MenuTrigger>
        <SplitButtonTrailing
          className="bg-tertiary-container text-on-tertiary-container"
          aria-label="More reply options"
        />
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
