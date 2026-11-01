import { Radio, RadioGroup } from '@material-web/react'

export default function Basic() {
  return (
    <RadioGroup
      aria-label="Ship to"
      defaultValue="home"
      className="flex flex-col items-start text-body-lg"
    >
      <Radio value="home">Home</Radio>
      <Radio value="office">Office</Radio>
      <Radio value="other">Other</Radio>
    </RadioGroup>
  )
}
