import { FabMenu, FabMenuButton, FabMenuItem, FabMenuPopover, Icon } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

const colors = ['primary', 'secondary', 'tertiary'] as const

export default function Colors() {
  return (
    <div className="box-border flex h-80 w-full items-end justify-center gap-space-600 p-space-200">
      {colors.map((color) => (
        <MenuTrigger key={color}>
          <FabMenuButton color={color} aria-label={`Create, ${color}`}>
            <Icon name="add" />
          </FabMenuButton>
          <FabMenuPopover>
            <FabMenu color={color}>
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
