import { TextField } from '@material-web/react'

export default function CharacterCounter() {
  return (
    <TextField
      label="Display name"
      description="Shown on your profile"
      defaultValue="Ada"
      maxLength={20}
      className="w-64"
    />
  )
}
