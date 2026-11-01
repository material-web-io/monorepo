import { Radio, RadioGroup } from '@material-web/react'

export default function WithLabel() {
  return (
    <>
      <RadioGroup aria-label="Size" defaultValue="m" className="flex gap-space-100 text-body-lg">
        <Radio value="s">Small</Radio>
        <Radio value="m">Medium</Radio>
        <Radio value="l">Large</Radio>
      </RadioGroup>
      <RadioGroup aria-label="Rating" defaultValue="2" className="flex">
        <Radio value="1" aria-label="1 star" />
        <Radio value="2" aria-label="2 stars" />
        <Radio value="3" aria-label="3 stars" />
      </RadioGroup>
    </>
  )
}
