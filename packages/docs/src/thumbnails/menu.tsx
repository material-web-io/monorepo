import { Icon, Menu, MenuItem } from '@material-web/react'

const actions = [
  ['Preview', 'visibility'],
  ['Share', 'person_add'],
  ['Get link', 'link'],
  ['Remove', 'delete'],
] as const

/**
 * A menu as it is open, which it only is over a page: its list of choices, in the vibrant
 * colors, on the panel a popover gives it.
 */
export default function MenuThumbnail() {
  return (
    <div className="flex size-full items-start justify-center pt-space-250">
      <div className="docs-thumbnail-panel w-52 overflow-clip rounded-shape-lg shadow-elevation-2">
        <Menu aria-label="Actions" color="vibrant">
          {actions.map(([action, icon]) => (
            <MenuItem key={action} textValue={action}>
              <Icon slot="leading" name={icon} />
              {action}
            </MenuItem>
          ))}
        </Menu>
      </div>
    </div>
  )
}
