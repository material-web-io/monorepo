import { Radio, RadioGroup } from '@material-web/react'

export default function Disabled() {
  return (
    <>
      <RadioGroup
        aria-label="Ship to"
        defaultValue="office"
        isDisabled
        className="flex flex-col items-start text-body-lg"
      >
        <Radio value="home">Home</Radio>
        <Radio value="office">Office</Radio>
      </RadioGroup>
      <RadioGroup
        aria-label="Delivery"
        defaultValue="standard"
        className="flex flex-col items-start text-body-lg"
      >
        <Radio value="standard">Standard</Radio>
        <Radio value="express" isDisabled>
          Express
        </Radio>
      </RadioGroup>
    </>
  )
}
