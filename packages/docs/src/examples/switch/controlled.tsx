import { Switch } from '@material-web/react'
import { useState } from 'react'

export default function Controlled() {
  const [isOn, setOn] = useState(true)
  return (
    <Switch icons="selected" isSelected={isOn} onChange={setOn} className="w-72">
      {({ isSelected }) => (
        <span className="flex flex-col ps-space-200">
          <span className="text-body-lg">Wi-Fi</span>
          <span className="text-body-md text-on-surface-variant">
            {isSelected ? 'Public Campus Wi-Fi' : 'Off'}
          </span>
        </span>
      )}
    </Switch>
  )
}
