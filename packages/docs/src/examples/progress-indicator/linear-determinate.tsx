import { Button, LinearProgressIndicator } from '@material-web/react'
import { useState } from 'react'

export default function LinearDeterminate() {
  const [value, setValue] = useState(40)
  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-space-300">
      <LinearProgressIndicator aria-label="Downloading update" value={value} />
      <Button variant="tonal" onPress={() => setValue(value >= 100 ? 0 : value + 20)}>
        {value >= 100 ? 'Start over' : 'Add 20%'}
      </Button>
    </div>
  )
}
