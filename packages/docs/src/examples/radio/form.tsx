import { Button, Radio, RadioGroup } from '@material-web/react'
import { useState } from 'react'
import { Label } from 'react-aria-components'

export default function Form() {
  const [sent, setSent] = useState('Nothing sent yet')
  return (
    <form
      className="flex flex-col items-start gap-space-100 text-body-lg"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
      }}
    >
      <RadioGroup name="delivery" defaultValue="standard" className="flex flex-col items-start">
        <Label className="ps-space-125 text-label-lg text-on-surface-variant">Delivery</Label>
        <Radio value="standard">Standard</Radio>
        <Radio value="express">Express</Radio>
        <Radio value="pickup">Pickup</Radio>
      </RadioGroup>
      <div className="flex gap-space-100">
        <Button type="reset" variant="text">
          Reset
        </Button>
        <Button type="submit">Send</Button>
      </div>
      <output className="ps-space-125 text-body-sm text-on-surface-variant">{sent}</output>
    </form>
  )
}
