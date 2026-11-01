import { TextField } from '@material-web/react'

export default function CustomInput() {
  return (
    <>
      <TextField
        label="City"
        input={(props) => <input {...props} list="cities" />}
        className="w-64"
      />
      <datalist id="cities">
        <option value="Calgary" />
        <option value="Edmonton" />
        <option value="Vancouver" />
      </datalist>
    </>
  )
}
