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

export default function Custom() {
  return (
    <SplitButton variant="tonal" className="density-2">
      <SplitButtonLeading>
        {({ isHovered }) => (
          <>
            <Icon name="bookmark" className={isHovered ? 'icon-filled' : undefined} />
            Save
          </>
        )}
      </SplitButtonLeading>
      <MenuTrigger>
        <SplitButtonTrailing aria-label="More save options" />
        <MenuPopover>
          <Menu>
            <MenuItem>Save to a list</MenuItem>
            <MenuItem>Save and share</MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </SplitButton>
  )
}
