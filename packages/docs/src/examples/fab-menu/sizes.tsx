import { FabMenu, FabMenuButton, FabMenuItem, FabMenuPopover, Icon } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

const sizes = ['baseline', 'medium', 'large'] as const

export default function Sizes() {
  return (
    <div className="box-border flex h-80 w-full items-end justify-center gap-space-600 p-space-200">
      {sizes.map((size) => (
        <MenuTrigger key={size}>
          <FabMenuButton size={size} aria-label={`Create, ${size}`}>
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu>
              <FabMenuItem textValue="Email">
                <Icon name="mail" />
                Email
              </FabMenuItem>
              <FabMenuItem textValue="Message">
                <Icon name="chat" />
                Message
              </FabMenuItem>
            </FabMenu>
          </FabMenuPopover>
        </MenuTrigger>
      ))}
    </div>
  )
}
