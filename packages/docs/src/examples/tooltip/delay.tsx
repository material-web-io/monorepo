import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'

export default function Delay() {
  return (
    <>
      <TooltipTrigger delay={0} closeDelay={0}>
        <IconButton aria-label="Undo">
          <Icon name="undo" className="rtl:icon-mirrored" />
        </IconButton>
        <Tooltip>Undo, at once</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger delay={1000} closeDelay={3000}>
        <IconButton aria-label="Redo">
          <Icon name="redo" className="rtl:icon-mirrored" />
        </IconButton>
        <Tooltip>Redo, after a second</Tooltip>
      </TooltipTrigger>
    </>
  )
}
