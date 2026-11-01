import { TextField } from '@material-web/react'

export default function LabelAndSupportingText() {
  return (
    <>
      <TextField
        label="Username"
        description="Letters and numbers only"
        placeholder="ada1815"
        className="w-64"
      />
      <TextField
        variant="outlined"
        label="Username"
        description="Letters and numbers only"
        defaultValue="ada1815"
        className="w-64"
      />
    </>
  )
}
