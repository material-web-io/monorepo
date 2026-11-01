import { AppBar, Divider, Icon, IconButton, Radio, RadioGroup } from '@material-web/react'
import { Heading } from 'react-aria-components'
import { PhoneTop } from '../components/phone'

const groups = [
  { title: 'Ship to', options: ['Home', 'Office', 'Pickup point'] },
  { title: 'Delivery speed', options: ['Standard', 'Express', 'Same day'] },
]

/** Radio buttons on the delivery of an order: two groups, one choice selected in each. */
export default function RadioScene() {
  return (
    <PhoneTop>
      <AppBar isScrolled={false}>
        <IconButton slot="leading" aria-label="Back">
          <Icon name="arrow_back" />
        </IconButton>
        <Heading slot="headline">Delivery</Heading>
      </AppBar>
      {groups.map(({ title, options }, index) => (
        <div key={title} className="flex shrink-0 flex-col">
          {index > 0 && <Divider />}
          <span className="px-space-300 pt-space-200 pb-space-50 text-title-sm text-primary">
            {title}
          </span>
          <RadioGroup
            aria-label={title}
            defaultValue={options[0]}
            className="flex flex-col items-start px-space-150 pb-space-100 text-body-lg"
          >
            {options.map((option) => (
              <Radio key={option} value={option}>
                {option}
              </Radio>
            ))}
          </RadioGroup>
        </div>
      ))}
    </PhoneTop>
  )
}
