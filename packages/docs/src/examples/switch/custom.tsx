import { Switch } from '@material-web/react'

export default function Custom() {
  return (
    <div className="flex flex-col items-start gap-space-100 text-body-lg">
      <Switch className="rounded-shape-full p-space-100 pe-space-300 has-hover:bg-surface-container">
        <span className="ps-space-200">Highlighted on hover</span>
      </Switch>
      <Switch
        defaultSelected
        className="rounded-shape-full p-space-100 pe-space-300 selected:bg-secondary-container"
      >
        <span className="ps-space-200">Tinted when selected</span>
      </Switch>
    </div>
  )
}
