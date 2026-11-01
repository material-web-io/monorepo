import { Icon, IconButton, SearchField } from '@material-web/react'
import { useState } from 'react'
import { Input } from 'react-aria-components'

export default function Controlled() {
  const [value, setValue] = useState('')
  const [submitted, setSubmitted] = useState('')
  return (
    <div className="flex w-full flex-col gap-space-200">
      <SearchField
        aria-label="Search your messages"
        value={value}
        onChange={setValue}
        onSubmit={setSubmitted}
        onClear={() => setSubmitted('')}
      >
        <Icon slot="leading" name="search" />
        <Input placeholder="Search your messages" />
        <IconButton aria-label="Clear search">
          <Icon name="close" />
        </IconButton>
      </SearchField>
      <p className="m-0 text-body-md text-on-surface-variant">
        Value: {value || 'none'}. Submitted: {submitted || 'none'}.
      </p>
    </div>
  )
}
