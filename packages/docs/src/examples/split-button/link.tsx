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

const spec = 'https://m3.material.io/components/split-button'

export default function LinkSplitButton() {
  return (
    <SplitButton variant="elevated">
      <SplitButtonLeading
        elementType="a"
        href={`${spec}/overview`}
        target="_blank"
        rel="noreferrer"
      >
        Read the spec
        <Icon name="open_in_new" />
      </SplitButtonLeading>
      <MenuTrigger>
        <SplitButtonTrailing aria-label="More pages of the spec" />
        <MenuPopover>
          <Menu>
            <MenuItem href={`${spec}/specs`} target="_blank" rel="noreferrer">
              Specs
            </MenuItem>
            <MenuItem href={`${spec}/guidelines`} target="_blank" rel="noreferrer">
              Guidelines
            </MenuItem>
          </Menu>
        </MenuPopover>
      </MenuTrigger>
    </SplitButton>
  )
}
