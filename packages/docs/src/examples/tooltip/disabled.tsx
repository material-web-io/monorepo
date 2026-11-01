import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'

export default function Disabled() {
  return (
    <>
      <TooltipTrigger isDisabled>
        <IconButton aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <Tooltip>Share</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Delete" isDisabled>
          <Icon name="delete" />
        </IconButton>
        <Tooltip>Delete</Tooltip>
      </TooltipTrigger>
    </>
  )
}
