import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'

const placements = [
  ['top', 'arrow_upward'],
  ['bottom', 'arrow_downward'],
  ['left', 'arrow_back'],
  ['right', 'arrow_forward'],
] as const

export default function Placement() {
  return (
    <>
      {placements.map(([placement, icon]) => (
        <TooltipTrigger key={placement}>
          <IconButton variant="tonal" aria-label={placement}>
            <Icon name={icon} />
          </IconButton>
          <Tooltip placement={placement}>{placement}</Tooltip>
        </TooltipTrigger>
      ))}
    </>
  )
}
