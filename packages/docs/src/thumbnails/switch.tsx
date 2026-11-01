import { Divider, Switch } from '@material-web/react'

/** Two settings at the side of a screen, a switch for each: one on, one off. */
export default function SwitchThumbnail() {
  return (
    <div className="docs-thumbnail-screen me-space-900 grow basis-0 justify-center self-stretch border-y-0 border-s-0 text-body-lg">
      <div className="flex items-center justify-between py-space-200 ps-space-400 pe-space-300">
        Wi-Fi
        <Switch aria-label="Wi-Fi" icons="selected" defaultSelected />
      </div>
      <Divider />
      <div className="flex items-center justify-between py-space-200 ps-space-400 pe-space-300">
        Bluetooth
        <Switch aria-label="Bluetooth" />
      </div>
    </div>
  )
}
