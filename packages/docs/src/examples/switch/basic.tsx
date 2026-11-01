import { Switch } from '@material-web/react'

export default function Basic() {
  return (
    <div className="flex flex-col items-start gap-space-200 text-body-lg">
      <Switch defaultSelected>
        <span className="ps-space-200">Wi-Fi</span>
      </Switch>
      <Switch>
        <span className="ps-space-200">Bluetooth</span>
      </Switch>
    </div>
  )
}
