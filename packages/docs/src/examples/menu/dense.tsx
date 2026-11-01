import { Button, Icon, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

const densities = [
  ['Default', undefined],
  ['Dense', 'density-3'],
] as const

export default function Dense() {
  return (
    <>
      {densities.map(([label, density]) => (
        <MenuTrigger key={label}>
          <Button variant="tonal">{label}</Button>
          <MenuPopover className={density}>
            <Menu>
              <MenuItem textValue="Single">
                <Icon slot="leading" name="density_large" />
                Single
              </MenuItem>
              <MenuItem textValue="1.15">
                <Icon slot="leading" name="density_medium" />
                1.15
              </MenuItem>
              <MenuItem textValue="Double">
                <Icon slot="leading" name="density_small" />
                Double
              </MenuItem>
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      ))}
    </>
  )
}
