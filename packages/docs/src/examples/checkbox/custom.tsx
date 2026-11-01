import { Checkbox } from '@material-web/react'

export default function Custom() {
  return (
    <div className="flex flex-col items-start gap-space-100 text-body-lg">
      <Checkbox className="rounded-shape-full pe-space-200 has-hover:bg-surface-container">
        Highlighted on hover
      </Checkbox>
      <Checkbox
        defaultSelected
        className="rounded-shape-full pe-space-200 selected:bg-secondary-container"
      >
        Tinted when selected
      </Checkbox>
    </div>
  )
}
