import { Button } from '@material-web/react'
import { useState } from 'react'

export default function Press() {
  const [pointerType, setPointerType] = useState<string>()
  return (
    <>
      <Button onPress={(event) => setPointerType(event.pointerType)}>Press me</Button>
      <span className="text-body-md text-on-surface-variant">
        {pointerType ? `Pressed with: ${pointerType}` : 'Not pressed yet'}
      </span>
    </>
  )
}
