import { Icon, Ripple } from '@material-web/react'
import { Button } from 'react-aria-components'

export default function Complex() {
  return (
    <Button className="relative focus-ring box-border flex w-72 cursor-pointer items-center gap-space-200 rounded-shape-lg border-0 bg-surface-container-high p-space-200 text-start font-plain text-on-surface outline-none">
      <Ripple />
      <span className="grid size-14 flex-none place-items-center rounded-shape-md bg-tertiary-container text-on-tertiary-container icon-24">
        <Icon name="hiking" />
      </span>
      <span className="flex flex-col">
        <span className="text-title-md">Hiking</span>
        <span className="text-body-md text-on-surface-variant">12 trails nearby</span>
      </span>
    </Button>
  )
}
