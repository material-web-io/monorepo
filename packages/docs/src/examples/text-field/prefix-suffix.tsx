import { TextField } from '@material-web/react'

export default function PrefixAndSuffix() {
  return (
    <>
      <TextField
        label="Amount"
        inputMode="decimal"
        defaultValue="12.50"
        prefix="€"
        className="w-48"
      />
      <TextField label="Weight" inputMode="numeric" suffix="lbs" className="w-48" />
      <TextField variant="outlined" label="Email" suffix="@gmail.com" className="w-48" />
    </>
  )
}
