import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'

export default function Triggers() {
  return (
    <>
      <TooltipTrigger>
        <IconButton aria-label="Undo">
          <Icon name="undo" className="rtl:icon-mirrored" />
        </IconButton>
        <Tooltip>Undo, on hover or focus</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger trigger="focus">
        <IconButton aria-label="Redo">
          <Icon name="redo" className="rtl:icon-mirrored" />
        </IconButton>
        <Tooltip>Redo, on focus alone</Tooltip>
      </TooltipTrigger>
    </>
  )
}
