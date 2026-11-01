import { Button, CircularProgressIndicator, LinearProgressIndicator } from '@material-web/react'
import { useState } from 'react'

export default function ToDeterminate() {
  const [isLoaded, setLoaded] = useState(false)
  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-space-300">
      <LinearProgressIndicator
        aria-label="Loading episodes"
        isIndeterminate={!isLoaded}
        value={100}
      />
      <CircularProgressIndicator
        aria-label="Loading artwork"
        isIndeterminate={!isLoaded}
        value={100}
      />
      <Button variant="tonal" onPress={() => setLoaded(!isLoaded)}>
        {isLoaded ? 'Load again' : 'Finish loading'}
      </Button>
    </div>
  )
}
