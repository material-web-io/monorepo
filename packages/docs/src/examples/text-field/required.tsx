import { TextField } from '@material-web/react'

export default function Required() {
  return <TextField label="Username" description="*required" isRequired className="w-64" />
}
