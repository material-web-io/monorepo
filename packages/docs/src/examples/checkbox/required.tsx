import { Button, Checkbox, CheckboxGroup } from '@material-web/react'
import { FieldError, Label } from 'react-aria-components'

export default function Required() {
  return (
    <form
      onSubmit={(event) => event.preventDefault()}
      className="flex flex-col items-start gap-space-100 text-body-lg"
    >
      <CheckboxGroup name="extras" isRequired className="flex flex-col items-start">
        <Label className="ps-space-150 text-label-lg text-on-surface-variant">Extras</Label>
        <Checkbox value="pickles">Pickles</Checkbox>
        <Checkbox value="tomato">Tomato</Checkbox>
        <Checkbox value="lettuce">Lettuce</Checkbox>
        <FieldError className="ps-space-150 text-body-sm text-error">Pick at least one</FieldError>
      </CheckboxGroup>
      <Button type="submit" className="ms-space-150">
        Order
      </Button>
    </form>
  )
}
