import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'

export default function Custom() {
  return (
    <>
      <TooltipTrigger>
        <IconButton aria-label="Delete">
          <Icon name="delete" />
        </IconButton>
        <Tooltip className="bg-error text-on-error">Delete</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Share">
          <Icon name="share" />
        </IconButton>
        <Tooltip className="rounded-shape-full px-space-150">Share</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Download">
          <Icon name="download" />
        </IconButton>
        <Tooltip data-theme="dark" variant="rich">
          Saved to your downloads folder.
        </Tooltip>
      </TooltipTrigger>
    </>
  )
}
