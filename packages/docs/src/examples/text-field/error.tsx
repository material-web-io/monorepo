import { Icon, TextField } from '@material-web/react'
import { useState } from 'react'

export default function ErrorState() {
  const [email, setEmail] = useState('name@')
  const isInvalid = email !== '' && !/^\S+@\S+\.\S+$/.test(email)
  return (
    <TextField
      variant="outlined"
      label="Email"
      type="email"
      value={email}
      onChange={setEmail}
      isInvalid={isInvalid}
      description={isInvalid ? 'Enter an address such as name@example.com' : 'Used to sign in'}
      trailing={isInvalid && <Icon name="error" className="icon-filled" aria-label="Error" />}
      className="w-80"
    />
  )
}
