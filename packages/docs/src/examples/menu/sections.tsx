import { Button, Icon, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { Header, MenuSection, MenuTrigger, Separator } from 'react-aria-components'

export default function Sections() {
  return (
    <MenuTrigger>
      <Button variant="tonal">Format</Button>
      <MenuPopover>
        <Menu>
          <MenuSection>
            <Header>Style</Header>
            <MenuItem textValue="Bold">
              <Icon slot="leading" name="format_bold" />
              Bold
            </MenuItem>
            <MenuItem textValue="Italic">
              <Icon slot="leading" name="format_italic" />
              Italic
            </MenuItem>
          </MenuSection>
          <Separator />
          <MenuSection>
            <Header>Alignment</Header>
            <MenuItem textValue="Left">
              <Icon slot="leading" name="format_align_left" />
              Left
            </MenuItem>
            <MenuItem textValue="Center">
              <Icon slot="leading" name="format_align_center" />
              Center
            </MenuItem>
          </MenuSection>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
