import { Checkbox, CheckboxGroup } from '@material-web/react'
import { useState } from 'react'

export default function GroupControlled() {
  const [extras, setExtras] = useState(['tomato'])
  return (
    <div className="flex flex-col items-start text-body-lg">
      <CheckboxGroup
        aria-label="Extras"
        value={extras}
        onChange={setExtras}
        className="flex flex-col items-start"
      >
        <Checkbox value="pickles">Pickles</Checkbox>
        <Checkbox value="tomato">Tomato</Checkbox>
        <Checkbox value="lettuce">Lettuce</Checkbox>
      </CheckboxGroup>
      <span className="ps-space-150 text-body-md text-on-surface-variant">
        {extras.length > 0 ? `With ${extras.join(', ')}` : 'No extras'}
      </span>
    </div>
  )
}
