import { Button, Menu, MenuItem, MenuPopover } from '@material-web/react'
import { MenuTrigger } from 'react-aria-components'

const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
]

const heights = [
  ['State', undefined],
  ['State, max 240dp', 240],
] as const

export default function Scrolling() {
  return (
    <>
      {heights.map(([label, maxHeight]) => (
        <MenuTrigger key={label}>
          <Button variant="outlined">{label}</Button>
          <MenuPopover maxHeight={maxHeight}>
            <Menu>
              {states.map((state) => (
                <MenuItem key={state}>{state}</MenuItem>
              ))}
            </Menu>
          </MenuPopover>
        </MenuTrigger>
      ))}
    </>
  )
}
