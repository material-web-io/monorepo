import { AppBar, Icon, IconButton, Menu, MenuItem, TextField } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const actions = [
  ['Revert', 'undo'],
  ['Delete', 'delete'],
  ['Settings', 'settings'],
  ['Help & feedback', 'help'],
] as const

/**
 * A menu as it is open, which it only is over a page: its list of choices, in the vibrant
 * colors, under the button of the app bar that opens it.
 */
export default function MenuScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">New contact</Heading>
        <IconButton slot="trailing" variant="tonal" aria-label="More options">
          <Icon name="more_vert" />
        </IconButton>
      </AppBar>
      <div className="flex shrink-0 flex-col gap-space-250 px-space-300 pt-space-100">
        <span className="grid size-24 place-items-center self-start rounded-full bg-tertiary-container text-on-tertiary-container icon-48 icon-filled">
          <Icon name="person" />
        </span>
        <TextField variant="outlined" label="First name" className="w-full" />
        <TextField variant="outlined" label="Last name" className="w-full" />
        <TextField variant="outlined" label="Phone" className="w-full" />
      </div>
      <div className="docs-thumbnail-panel absolute end-space-200 top-24 w-56 overflow-clip rounded-shape-lg shadow-elevation-2">
        <Menu aria-label="Actions" color="vibrant">
          {actions.map(([action, icon]) => (
            <MenuItem key={action} textValue={action}>
              <Icon slot="leading" name={icon} />
              {action}
            </MenuItem>
          ))}
        </Menu>
      </div>
    </PhoneTop>
  )
}
