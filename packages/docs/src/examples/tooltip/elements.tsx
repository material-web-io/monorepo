import { Button, Fab, Icon, Tooltip, TooltipTrigger } from '@material-web/react'
import { Focusable } from 'react-aria-components'

export default function Elements() {
  return (
    <>
      <TooltipTrigger>
        <Button variant="tonal">Publish</Button>
        <Tooltip>Publish to everyone</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Fab aria-label="Compose">
          <Icon name="edit" />
        </Fab>
        <Tooltip>Compose</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Focusable>
          <span
            role="img"
            aria-label="Verified"
            tabIndex={0}
            className="focus-ring flex rounded-shape-full text-primary icon-24"
          >
            <Icon name="verified" />
          </span>
        </Focusable>
        <Tooltip>This account is verified</Tooltip>
      </TooltipTrigger>
    </>
  )
}
