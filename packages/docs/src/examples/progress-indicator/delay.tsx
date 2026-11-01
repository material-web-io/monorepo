import { Button, LinearProgressIndicator } from '@material-web/react'
import { useRef, useState } from 'react'

export default function Delay() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'slow'>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const start = () => {
    setStatus('loading')
    // The indicator appears once the process has run for a second.
    timer.current = setTimeout(() => setStatus('slow'), 1000)
  }
  const stop = () => {
    clearTimeout(timer.current)
    setStatus('idle')
  }

  return (
    <div className="flex w-full max-w-96 flex-col items-center gap-space-300">
      <div className="h-space-50 w-full">
        {status === 'slow' && (
          <LinearProgressIndicator aria-label="Loading results" isIndeterminate />
        )}
      </div>
      <Button variant="tonal" onPress={status === 'idle' ? start : stop}>
        {status === 'idle' ? 'Start loading' : 'Stop loading'}
      </Button>
    </div>
  )
}
