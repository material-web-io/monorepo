import { LoadingIndicator } from '@material-web/react'
import { useId } from 'react'

export default function Labelled() {
  const id = useId()
  return (
    <div className="flex items-center gap-space-200">
      <LoadingIndicator aria-labelledby={id} />
      <span id={id} className="text-body-lg">
        Loading my episodes
      </span>
    </div>
  )
}
