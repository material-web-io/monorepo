import {
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuPopover,
  Tooltip,
  TooltipTrigger,
} from '@material-web/react'
import {
  Header,
  MenuSection,
  MenuTrigger,
  Separator,
  type PopoverProps,
  type Selection,
} from 'react-aria-components'
import { useMediaQuery } from '../media'
import { setSettings, useSettings, type Settings } from '../settings'

const groups: { [Name in keyof Settings]: { title: string; options: [Settings[Name], string][] } } =
  {
    theme: {
      title: 'Theme',
      options: [
        ['system', 'System'],
        ['light', 'Light'],
        ['dark', 'Dark'],
      ],
    },
    contrast: {
      title: 'Contrast',
      options: [
        ['standard', 'Standard'],
        ['medium', 'Medium'],
        ['high', 'High'],
      ],
    },
    motion: {
      title: 'Motion',
      options: [
        ['expressive', 'Expressive'],
        ['standard', 'Standard'],
      ],
    },
  }

type Placed = Pick<PopoverProps, 'placement'> & {
  /** Where the button is: in the rail, outlined, or in a slot of the app bar. */
  slot?: string
}

/**
 * The theme's switches, in a menu: light or dark, the contrast level and the motion scheme.
 * An item's id is its group's name and its value, since a menu's ids are one set.
 */
export function SettingsMenu({ placement, slot }: Placed) {
  const settings = useSettings()
  const names = Object.keys(groups) as (keyof Settings)[]
  return (
    <MenuTrigger>
      <IconButton slot={slot} variant={slot ? 'standard' : 'outlined'} aria-label="Appearance">
        <Icon name="tune" />
      </IconButton>
      <MenuPopover placement={placement}>
        <Menu aria-label="Appearance">
          {names.flatMap((name, index) => [
            index > 0 && <Separator key={`${name}-separator`} />,
            <MenuSection
              key={name}
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[`${name}:${settings[name]}`]}
              onSelectionChange={(keys: Selection) => {
                const [key] = keys === 'all' ? [] : keys
                if (key !== undefined) setSettings({ [name]: String(key).slice(name.length + 1) })
              }}
            >
              <Header>{groups[name].title}</Header>
              {groups[name].options.map(([value, label]) => (
                <MenuItem key={value} id={`${name}:${value}`}>
                  {label}
                </MenuItem>
              ))}
            </MenuSection>,
          ])}
        </Menu>
      </MenuPopover>
    </MenuTrigger>
  )
}

/** The button that turns the page dark or light, whichever it is not, the system's or not. */
export function ThemeToggle({ placement, slot }: Placed) {
  const { theme } = useSettings()
  const isSystemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const isDark = theme === 'dark' || (theme === 'system' && isSystemDark)
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme'
  return (
    <TooltipTrigger>
      <IconButton
        slot={slot}
        variant={slot ? 'standard' : 'outlined'}
        aria-label={label}
        onPress={() => setSettings({ theme: isDark ? 'light' : 'dark' })}
      >
        <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
      </IconButton>
      <Tooltip placement={placement}>{label}</Tooltip>
    </TooltipTrigger>
  )
}
