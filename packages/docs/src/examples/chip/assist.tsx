import { Chip, ChipGroup, Icon } from '@material-web/react'
import { useState } from 'react'
import type { Key } from 'react-aria-components'

export default function Assist() {
  const [action, setAction] = useState<Key>()
  return (
    <div className="flex flex-col items-center gap-space-200">
      <ChipGroup aria-label="Actions" onAction={setAction}>
        <Chip id="calendar" variant="assist" textValue="Add to calendar">
          <Icon slot="leading" name="event" />
          Add to calendar
        </Chip>
        <Chip id="directions" variant="assist" textValue="Get directions">
          <Icon slot="leading" name="directions" />
          Get directions
        </Chip>
        <Chip id="share" variant="assist" textValue="Share">
          <Icon slot="leading" name="share" />
          Share
        </Chip>
      </ChipGroup>
      <p className="m-0 text-body-md text-on-surface-variant">
        {action ? `Last action: ${action}` : 'No action yet'}
      </p>
    </div>
  )
}
