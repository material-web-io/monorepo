import { Icon, IconButton } from '@material-web/react'
import { useState } from 'react'

export default function Loading() {
  const [isSending, setSending] = useState(false)
  const send = async () => {
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setSending(false)
  }
  return (
    <IconButton variant="filled" size="m" aria-label="Send" isPending={isSending} onPress={send}>
      <Icon name="send" className="rtl:icon-mirrored" />
    </IconButton>
  )
}
