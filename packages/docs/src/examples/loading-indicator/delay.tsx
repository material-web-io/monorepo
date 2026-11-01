import { Button, LoadingIndicator } from '@material-web/react'
import { useState } from 'react'

export default function Delay() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'slow'>('idle')

  const load = (duration: number) => {
    if (status !== 'idle') return
    setStatus('loading')
    // The indicator appears only if the activity is still running after 200ms.
    const delay = setTimeout(() => setStatus('slow'), 200)
    setTimeout(() => {
      clearTimeout(delay)
      setStatus('idle')
    }, duration)
  }

  return (
    <div className="flex flex-col items-center gap-space-300">
      <div className="size-12">
        {status === 'slow' && <LoadingIndicator aria-label="Loading results" />}
      </div>
      <div className="flex gap-space-100">
        <Button variant="tonal" onPress={() => load(100)}>
          Load for 100ms
        </Button>
        <Button variant="tonal" onPress={() => load(3000)}>
          Load for 3s
        </Button>
      </div>
    </div>
  )
}
