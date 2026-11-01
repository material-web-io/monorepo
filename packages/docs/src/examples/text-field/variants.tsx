import { TextField } from '@material-web/react'

export default function Variants() {
  return (
    <>
      <TextField variant="filled" label="Filled" description="Supporting text" className="w-64" />
      <TextField
        variant="outlined"
        label="Outlined"
        description="Supporting text"
        className="w-64"
      />
    </>
  )
}
