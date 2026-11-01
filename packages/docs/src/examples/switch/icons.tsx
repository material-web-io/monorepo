import { Switch } from '@material-web/react'

export default function Icons() {
  return (
    <div className="grid grid-cols-3 items-center justify-items-center gap-space-200">
      <Switch aria-label="No icons, off" />
      <Switch icons="selected" aria-label="Selected icon, off" />
      <Switch icons="both" aria-label="Both icons, off" />
      <Switch defaultSelected aria-label="No icons, on" />
      <Switch icons="selected" defaultSelected aria-label="Selected icon, on" />
      <Switch icons="both" defaultSelected aria-label="Both icons, on" />
      <span className="text-label-md text-on-surface-variant">none</span>
      <span className="text-label-md text-on-surface-variant">selected</span>
      <span className="text-label-md text-on-surface-variant">both</span>
    </div>
  )
}
