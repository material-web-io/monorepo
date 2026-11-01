import { Switch } from '@material-web/react'

export default function Disabled() {
  return (
    <div className="flex flex-col items-start gap-space-200 text-body-lg">
      <Switch isDisabled>
        <span className="ps-space-200">Wi-Fi</span>
      </Switch>
      <Switch isDisabled defaultSelected icons="both">
        <span className="ps-space-200">Bluetooth</span>
      </Switch>
    </div>
  )
}
