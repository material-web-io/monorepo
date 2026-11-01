import { Checkbox } from '@material-web/react'

export default function RenderProps() {
  return (
    <Checkbox className="text-body-lg">
      {({ isSelected }) => (isSelected ? 'Notifications are on' : 'Notifications are off')}
    </Checkbox>
  )
}
