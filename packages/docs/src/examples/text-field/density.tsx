import { TextField } from '@material-web/react'

export default function Density() {
  return (
    <>
      <TextField variant="outlined" label="Default" defaultValue="56dp" className="w-40" />
      <TextField
        variant="outlined"
        label="density-1"
        defaultValue="52dp"
        className="w-40 density-1"
      />
      <TextField
        variant="outlined"
        label="density-2"
        defaultValue="48dp"
        className="w-40 density-2"
      />
      <TextField
        variant="outlined"
        label="density-3"
        defaultValue="44dp"
        className="w-40 density-3"
      />
    </>
  )
}
