import { Checkbox } from '@material-web/react'

/** Checkboxes under a title, at the side of a screen: one selected, one not. */
export default function CheckboxThumbnail() {
  return (
    <div className="docs-thumbnail-screen ms-space-900 grow basis-0 justify-center self-stretch border-y-0 border-e-0 ps-space-300">
      <span className="ps-space-150 pb-space-100 text-title-lg">Toppings</span>
      <div className="flex flex-col items-start text-body-lg">
        <Checkbox defaultSelected>Pickles</Checkbox>
        <Checkbox>Tomato</Checkbox>
      </div>
    </div>
  )
}
