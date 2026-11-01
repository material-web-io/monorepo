import { Button, Icon } from '@material-web/react'
import { useState } from 'react'
import { FileTrigger } from 'react-aria-components'

export default function FileUpload() {
  const [names, setNames] = useState<string[]>([])
  return (
    <>
      <FileTrigger
        allowsMultiple
        onSelect={(files) => setNames(Array.from(files ?? [], (file) => file.name))}
      >
        <Button variant="tonal">
          <Icon name="upload" />
          Upload files
        </Button>
      </FileTrigger>
      {names.length > 0 && (
        <span className="text-body-md text-on-surface-variant">{names.join(', ')}</span>
      )}
    </>
  )
}
