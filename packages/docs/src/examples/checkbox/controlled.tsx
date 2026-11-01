import { Checkbox } from '@material-web/react'
import { useState } from 'react'

export default function Controlled() {
  const [isSelected, setSelected] = useState(true)
  return (
    <div className="flex flex-col items-start text-body-lg">
      <Checkbox isSelected={isSelected} onChange={setSelected}>
        Email me the receipt
      </Checkbox>
      <span className="ps-space-500 text-body-md text-on-surface-variant">
        {isSelected ? 'A receipt will be sent' : 'No receipt will be sent'}
      </span>
    </div>
  )
}
