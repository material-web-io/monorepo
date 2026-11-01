import { Button, Radio, RadioGroup } from '@material-web/react'
import { FieldError, Label } from 'react-aria-components'

export default function Required() {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col items-start gap-space-100 text-body-lg"
    >
      <RadioGroup name="delivery" isRequired className="flex flex-col items-start">
        <Label className="ps-space-125 text-label-lg text-on-surface-variant">Delivery</Label>
        <Radio value="standard">Standard</Radio>
        <Radio value="express">Express</Radio>
        <Radio value="pickup">Pickup</Radio>
        <FieldError className="ps-space-125 text-body-sm text-error">Choose a delivery</FieldError>
      </RadioGroup>
      <Button type="submit" className="ms-space-125">
        Order
      </Button>
    </form>
  )
}
