import { Switch } from '@material-web/react'

export default function WithLabel() {
  return (
    <>
      <Switch defaultSelected className="text-body-lg">
        <span className="ps-space-200">Dark mode</span>
      </Switch>
      <Switch aria-label="Airplane mode" />
    </>
  )
}
