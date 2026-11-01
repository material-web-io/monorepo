import { Slider } from '@material-web/react'
import { useState } from 'react'
import { Label } from 'react-aria-components'

export default function Controlled() {
  const [range, setRange] = useState([18, 24])
  const [saved, setSaved] = useState(range)
  return (
    <Slider
      minValue={10}
      maxValue={30}
      step={0.5}
      value={range}
      onChange={setRange}
      onChangeEnd={setSaved}
      className="w-80 gap-space-100"
    >
      <div className="flex justify-between px-space-150 text-body-md text-on-surface">
        <Label>Temperature</Label>
        <span className="text-on-surface-variant">
          {range.join(' to ')} °C, saved {saved.join(' to ')}
        </span>
      </div>
    </Slider>
  )
}
