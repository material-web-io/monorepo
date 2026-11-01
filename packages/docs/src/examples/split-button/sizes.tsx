import {
  Menu,
  MenuItem,
  MenuPopover,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

export default function Sizes() {
  return (
    <>
      {sizes.map((size) => (
        <SplitButton key={size} size={size}>
          <SplitButtonLeading>Reply</SplitButtonLeading>
          <MenuTrigger>
            <SplitButtonTrailing aria-label={`More reply options, ${size}`} />
            <MenuPopover>
              <Menu>
                <MenuItem>Reply all</MenuItem>
                <MenuItem>Forward</MenuItem>
              </Menu>
            </MenuPopover>
          </MenuTrigger>
        </SplitButton>
      ))}
    </>
  )
}
