import { Icon, TextField } from '@material-web/react'
import { useState } from 'react'

export default function RenderProps() {
  const [name, setName] = useState('ada lovelace')
  return (
    <TextField
      variant="outlined"
      label="Username"
      description="No spaces"
      value={name}
      onChange={setName}
      isInvalid={name.includes(' ')}
      className="w-64"
      leading={({ isFocusWithin }) => (
        <Icon name="person" className={isFocusWithin ? 'icon-filled' : undefined} />
      )}
      trailing={({ isInvalid }) =>
        isInvalid && <Icon name="error" className="icon-filled" aria-label="Error" />
      }
    />
  )
}
