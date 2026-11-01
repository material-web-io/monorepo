import { Radio, RadioGroup } from '@material-web/react'

const sizes = ['A4', 'A5', 'Letter']

export default function Custom() {
  return (
    <RadioGroup
      aria-label="Paper size"
      defaultValue="A4"
      className="flex flex-col items-start gap-space-100 text-body-lg"
    >
      {sizes.map((size) => (
        <Radio
          key={size}
          value={size}
          className="rounded-shape-full pe-space-200 has-hover:bg-surface-container selected:bg-secondary-container"
        >
          {size}
        </Radio>
      ))}
    </RadioGroup>
  )
}
