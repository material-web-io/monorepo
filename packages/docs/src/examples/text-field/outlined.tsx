import { TextField } from '@material-web/react'

export default function Outlined() {
  return (
    <>
      <TextField
        variant="outlined"
        label="Outlined"
        description="Supporting text"
        className="w-64"
      />
      <TextField variant="outlined" label="Disabled" isDisabled className="w-64" />
    </>
  )
}
