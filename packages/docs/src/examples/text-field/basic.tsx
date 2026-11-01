import { Icon, IconButton, TextField } from '@material-web/react'
import { useState } from 'react'

export default function Basic() {
  const [amount, setAmount] = useState('12.50')
  return (
    <TextField
      variant="outlined"
      label="Amount"
      description="Before tax"
      name="amount"
      inputMode="decimal"
      isRequired
      maxLength={8}
      prefix="€"
      value={amount}
      onChange={setAmount}
      trailing={
        <IconButton aria-label="Clear" onPress={() => setAmount('')}>
          <Icon name="cancel" />
        </IconButton>
      }
      className="w-64"
    />
  )
}
