import { TextField } from '@material-web/react'

export default function Filled() {
  return (
    <>
      <TextField variant="filled" label="Filled" description="Supporting text" className="w-64" />
      <TextField variant="filled" label="Disabled" isDisabled className="w-64" />
    </>
  )
}
