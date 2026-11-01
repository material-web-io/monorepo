import { parseDate } from '@internationalized/date'
import { Button, DateField } from '@material-web/react'
import { useState } from 'react'
import { Form } from 'react-aria-components'

export default function InForm() {
  const [sent, setSent] = useState<string | null>(null)
  return (
    <Form
      className="flex flex-col items-start gap-space-300"
      onSubmit={(event) => {
        event.preventDefault()
        setSent(String(new FormData(event.currentTarget).get('date')))
      }}
      onReset={() => setSent(null)}
    >
      <DateField label="Date" name="date" defaultValue={parseDate('2025-08-17')} className="w-80" />
      <div className="flex gap-space-100">
        <Button variant="text" type="reset">
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </div>
      {sent && <p className="m-0 text-body-md text-on-surface-variant">Sent: {sent}</p>}
    </Form>
  )
}
