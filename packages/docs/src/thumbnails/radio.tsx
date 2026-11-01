import { Radio, RadioGroup } from '@material-web/react'

/** Radio buttons under a title, at the side of a screen: the first one selected. */
export default function RadioThumbnail() {
  return (
    <div className="docs-thumbnail-screen ms-space-900 grow basis-0 justify-center self-stretch border-y-0 border-e-0 ps-space-300">
      <span className="ps-space-150 pb-space-100 text-title-lg">Ship to</span>
      <RadioGroup
        aria-label="Ship to"
        defaultValue="home"
        className="flex flex-col items-start text-body-lg"
      >
        <Radio value="home">Home</Radio>
        <Radio value="office">Office</Radio>
      </RadioGroup>
    </div>
  )
}
