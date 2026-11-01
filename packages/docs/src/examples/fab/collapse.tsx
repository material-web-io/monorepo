import { Fab, Icon } from '@material-web/react'
import { useRef, useState, type UIEvent } from 'react'
import { Text } from 'react-aria-components'

const messages = Array.from({ length: 24 }, (_, index) => `Message ${index + 1}`)

export default function Collapse() {
  const [isExtended, setExtended] = useState(true)
  const lastTop = useRef(0)
  const onScroll = (event: UIEvent<HTMLUListElement>) => {
    const top = event.currentTarget.scrollTop
    if (Math.abs(top - lastTop.current) < 8) return
    setExtended(top < lastTop.current)
    lastTop.current = top
  }
  return (
    <div className="relative h-96">
      <ul
        tabIndex={0}
        className="focus-ring-inset m-0 box-border h-full list-none overflow-y-auto p-space-100"
        onScroll={onScroll}
      >
        {messages.map((message) => (
          <li key={message} className="p-space-200 text-body-lg text-on-surface">
            {message}
          </li>
        ))}
      </ul>
      <Fab
        isExtended={isExtended}
        aria-label="Compose"
        className="absolute right-space-200 bottom-space-200"
      >
        <Icon name="edit" />
        <Text slot="label">Compose</Text>
      </Fab>
    </div>
  )
}
