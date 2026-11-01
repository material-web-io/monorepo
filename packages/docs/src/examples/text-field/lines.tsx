import { TextField } from '@material-web/react'

const note =
  'This is a long input that wraps overflow text onto a new line, past the height of the text area.'

export default function Lines() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-space-200">
      <TextField label="Multi-line" lines="multi" defaultValue={note} className="w-64" />
      <TextField
        variant="outlined"
        label="Text area"
        lines="area"
        rows={3}
        defaultValue={note}
        className="w-64"
      />
    </div>
  )
}
