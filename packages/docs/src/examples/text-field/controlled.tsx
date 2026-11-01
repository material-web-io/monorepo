import { TextField } from '@material-web/react'
import { useState } from 'react'

export default function Controlled() {
  const [name, setName] = useState('Ada')
  return (
    <>
      <TextField label="Uncontrolled" defaultValue="Ada" className="w-48" />
      <TextField label="Controlled" value={name} onChange={setName} className="w-48" />
      <span className="text-body-md text-on-surface-variant">
        {name === '' ? 'No name yet' : `Hello, ${name}`}
      </span>
    </>
  )
}
