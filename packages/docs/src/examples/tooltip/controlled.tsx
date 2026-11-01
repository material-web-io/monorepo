import { Button, Tooltip, TooltipTrigger } from '@material-web/react'
import { useState } from 'react'

export default function Controlled() {
  const [isOpen, setOpen] = useState(false)
  return (
    <>
      <TooltipTrigger isOpen={isOpen} onOpenChange={setOpen}>
        <Button variant="outlined">Sync</Button>
        <Tooltip>Sync your files now</Tooltip>
      </TooltipTrigger>
      <span className="text-body-md text-on-surface-variant">
        The tooltip is {isOpen ? 'open' : 'closed'}
      </span>
    </>
  )
}
