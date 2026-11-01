import { Button, Radio, RadioGroup } from '@material-web/react'
import { useState } from 'react'
import { Label } from 'react-aria-components'

export default function Controlled() {
  const [address, setAddress] = useState<string | null>('home')
  return (
    <RadioGroup
      value={address}
      onChange={setAddress}
      className="flex flex-col items-start text-body-lg"
    >
      <Label className="ps-space-125 text-label-lg text-on-surface-variant">
        Ship to: {address ?? 'nowhere yet'}
      </Label>
      <Radio value="home">Home</Radio>
      <Radio value="office">Office</Radio>
      <Radio value="other">Other</Radio>
      <Button variant="text" isDisabled={address === null} onPress={() => setAddress(null)}>
        Clear selection
      </Button>
    </RadioGroup>
  )
}
