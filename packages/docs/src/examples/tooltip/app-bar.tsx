import { AppBar, Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'
import { Heading } from 'react-aria-components'

const actions = [
  ['Add to favorites', 'star'],
  ['Share', 'share'],
  ['Download', 'download'],
] as const

export default function InAppBar() {
  return (
    <div className="h-40 w-full">
      <AppBar>
        <Heading slot="headline" level={2}>
          Photos
        </Heading>
        {actions.map(([label, icon]) => (
          <TooltipTrigger key={label}>
            <IconButton slot="trailing" aria-label={label}>
              <Icon name={icon} />
            </IconButton>
            <Tooltip placement="bottom">{label}</Tooltip>
          </TooltipTrigger>
        ))}
      </AppBar>
    </div>
  )
}
