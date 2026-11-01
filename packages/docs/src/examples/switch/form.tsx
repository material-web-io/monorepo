import { Button, Switch } from '@material-web/react'
import { useState } from 'react'

export default function Form() {
  const [sent, setSent] = useState('Nothing sent yet')
  return (
    <form
      className="flex flex-col items-start gap-space-200 text-body-lg"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
      }}
    >
      <Switch name="newsletter" value="weekly" defaultSelected>
        <span className="ps-space-200">Weekly newsletter</span>
      </Switch>
      <div className="flex gap-space-100">
        <Button type="reset" variant="text">
          Reset
        </Button>
        <Button type="submit">Save</Button>
      </div>
      <output className="text-body-sm text-on-surface-variant">{sent}</output>
    </form>
  )
}
