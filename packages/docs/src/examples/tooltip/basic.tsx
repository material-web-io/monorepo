import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'

const actions = [
  ['Add to favorites', 'star'],
  ['Share', 'share'],
  ['Download', 'download'],
  ['Delete', 'delete'],
] as const

export default function Basic() {
  return (
    <>
      {actions.map(([label, icon]) => (
        <TooltipTrigger key={label}>
          <IconButton aria-label={label}>
            <Icon name={icon} />
          </IconButton>
          <Tooltip>{label}</Tooltip>
        </TooltipTrigger>
      ))}
    </>
  )
}
