import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'

export default function MultiLine() {
  return (
    <TooltipTrigger>
      <IconButton aria-label="Grant value">
        <Icon name="info" />
      </IconButton>
      <Tooltip>
        Grant value is calculated using the closing stock price from the day before the grant date.
      </Tooltip>
    </TooltipTrigger>
  )
}
