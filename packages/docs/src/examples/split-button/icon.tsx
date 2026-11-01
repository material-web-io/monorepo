import {
  Icon,
  Menu,
  MenuItem,
  MenuPopover,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

export default function WithIcon() {
  return (
    <>
      <SplitButton variant="tonal">
        <SplitButtonLeading>
          <Icon name="reply" />
          Reply
        </SplitButtonLeading>
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
      <SplitButton variant="tonal">
        <SplitButtonLeading aria-label="Edit">
          <Icon name="edit" />
        </SplitButtonLeading>
        <MenuTrigger>
          <SplitButtonTrailing aria-label="More edit options" />
          <MenuPopover>
            <Menu>
              <MenuItem>Rename</MenuItem>
              <MenuItem>Duplicate</MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      </SplitButton>
    </>
  )
}
