import { Button, TextField } from '@material-web/react'
import { useState } from 'react'

export default function Form() {
  const [sent, setSent] = useState<string>()
  return (
    <form
      className="flex w-80 flex-col gap-space-200"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))))
      }}
    >
      <span className="text-body-md text-on-surface-variant">*indicates a required field</span>
      <TextField variant="outlined" label="Name" name="name" autoComplete="name" isRequired />
      <TextField variant="outlined" label="Email" name="email" type="email" autoComplete="email" />
      <TextField
        variant="outlined"
        label="Message"
        name="message"
        lines="area"
        rows={4}
        maxLength={200}
      />
      <div className="flex justify-end gap-space-100">
        <Button type="reset" variant="text" onPress={() => setSent(undefined)}>
          Reset
        </Button>
        <Button type="submit">Send</Button>
      </div>
      {sent && <output className="text-body-sm text-on-surface-variant">{sent}</output>}
    </form>
  )
}
