import { SplitButton, SplitButtonLeading, SplitButtonTrailing } from '@material-web/react'
import { useId, useState } from 'react'

export default function Expanded() {
  const [isOpen, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div className="flex flex-col items-center gap-space-200">
      <SplitButton variant="outlined">
        <SplitButtonLeading>Export</SplitButtonLeading>
        <SplitButtonTrailing
          aria-label="More export options"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onPress={() => setOpen(!isOpen)}
        />
      </SplitButton>
      <p id={panelId} hidden={!isOpen} className="m-0 text-body-md text-on-surface-variant">
        Exports as PDF, at the size of the page.
      </p>
    </div>
  )
}
