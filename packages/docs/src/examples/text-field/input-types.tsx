import { TextField } from '@material-web/react'

export default function InputTypes() {
  return (
    <>
      <TextField label="Date" type="date" className="w-48" />
      <TextField label="Time" type="time" className="w-48" />
      <TextField label="Quantity" type="number" placeholder="0" className="w-48" />
    </>
  )
}
