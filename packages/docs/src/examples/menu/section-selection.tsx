import { Button, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { useState } from 'react'
import { Header, MenuSection, MenuTrigger, Separator, type Selection } from 'react-aria-components'

export default function SectionSelection() {
  const [style, setStyle] = useState<Selection>(new Set(['bold']))
  const [align, setAlign] = useState<Selection>(new Set(['left']))
  return (
    <MenuTrigger>
      <Button variant="outlined">Format</Button>
      <MenuPopover>
        <Menu>
          <MenuSection selectionMode="multiple" selectedKeys={style} onSelectionChange={setStyle}>
            <Header>Style</Header>
            <MenuItem id="bold">Bold</MenuItem>
            <MenuItem id="italic">Italic</MenuItem>
            <MenuItem id="underline">Underline</MenuItem>
          </MenuSection>
          <Separator />
          <MenuSection
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={align}
            onSelectionChange={setAlign}
          >
            <Header>Alignment</Header>
            <MenuItem id="left">Left</MenuItem>
            <MenuItem id="center">Center</MenuItem>
            <MenuItem id="right">Right</MenuItem>
          </MenuSection>
          <Separator />
          <MenuItem id="clear">Clear formatting</MenuItem>
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}
