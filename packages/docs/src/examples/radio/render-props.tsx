import { Radio, RadioGroup } from '@material-web/react'

const plans = [
  { value: 'monthly', name: 'Monthly', price: '$12 a month' },
  { value: 'yearly', name: 'Yearly', price: '$120 a year' },
]

export default function RenderProps() {
  return (
    <RadioGroup aria-label="Plan" defaultValue="monthly" className="flex flex-col items-start">
      {plans.map(({ value, name, price }) => (
        <Radio key={value} value={value}>
          {({ isSelected }) => (
            <span className="flex flex-col py-space-100">
              <span className="text-body-lg">{name}</span>
              <span
                className={
                  isSelected ? 'text-body-md text-primary' : 'text-body-md text-on-surface-variant'
                }
              >
                {price}
              </span>
            </span>
          )}
        </Radio>
      ))}
    </RadioGroup>
  )
}
