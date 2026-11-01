import {
  Menu,
  MenuItem,
  MenuPopover,
  SplitButton,
  SplitButtonLeading,
  SplitButtonTrailing,
} from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

const variants = ['elevated', 'filled', 'tonal', 'outlined'] as const

export default function Variants() {
  return (
    <>
      {variants.map((variant) => (
        <SplitButton key={variant} variant={variant}>
          <SplitButtonLeading>Reply</SplitButtonLeading>
          <MenuTrigger>
            <SplitButtonTrailing aria-label={`More reply options, ${variant}`} />
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
