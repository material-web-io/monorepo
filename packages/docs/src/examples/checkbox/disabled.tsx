import { Checkbox } from '@material-web/react'

export default function Disabled() {
  return (
    <div className="flex flex-col items-start text-body-lg">
      <Checkbox isDisabled>Pickles</Checkbox>
      <Checkbox isDisabled defaultSelected>
        Tomato
      </Checkbox>
      <Checkbox isDisabled isIndeterminate>
        Lettuce
      </Checkbox>
    </div>
  )
}
