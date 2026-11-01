import { Button, Tooltip, TooltipTrigger } from '@material-web/react'

export default function Offset() {
  return (
    <>
      <TooltipTrigger>
        <Button variant="outlined">Default</Button>
        <Tooltip>4dp away</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="text">Text</Button>
        <Tooltip offset={8}>8dp away</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <Button variant="outlined">Farther</Button>
        <Tooltip offset={16}>16dp away</Tooltip>
      </TooltipTrigger>
    </>
  )
}
