import { Checkbox } from '@material-web/react'

export default function Basic() {
  return (
    <div className="flex flex-col items-start text-body-lg">
      <Checkbox defaultSelected>Pickles</Checkbox>
      <Checkbox>Tomato</Checkbox>
      <Checkbox>Lettuce</Checkbox>
    </div>
  )
}
