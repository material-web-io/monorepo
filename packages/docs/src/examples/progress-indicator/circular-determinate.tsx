import { Button, CircularProgressIndicator } from '@material-web/react'
import { useState } from 'react'

export default function CircularDeterminate() {
  const [value, setValue] = useState(40)
  return (
    <div className="flex flex-col items-center gap-space-300">
      <CircularProgressIndicator aria-label="Installing update" value={value} />
      <Button variant="tonal" onPress={() => setValue(value >= 100 ? 0 : value + 20)}>
        {value >= 100 ? 'Start over' : 'Add 20%'}
      </Button>
    </div>
  )
}
