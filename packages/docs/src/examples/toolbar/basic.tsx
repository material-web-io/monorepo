import { Icon, IconButton, Toolbar } from '@material-web/react'
import { useState } from 'react'

export default function Basic() {
  const [isStarred, setStarred] = useState(false)
  return (
    <div className="flex h-80 w-full flex-col">
      <div className="flex-1 overflow-y-auto p-space-300">
        <h3 className="m-0 text-title-lg">Cabin for the weekend</h3>
        <p className="mt-space-100 mb-0 text-body-lg text-on-surface-variant">
          Hey! I’ve got pics and more info on our cabin for the weekend. Get ready to be impressed:
          it looks absolutely incredible from what I can see.
        </p>
      </div>
      <Toolbar aria-label="Message">
        <IconButton aria-label="Archive">
          <Icon name="archive" />
        </IconButton>
        <IconButton aria-label="Delete">
          <Icon name="delete" />
        </IconButton>
        <IconButton aria-label="Mark as unread">
          <Icon name="mark_email_unread" />
        </IconButton>
        <IconButton aria-label="Star" isSelectable isSelected={isStarred} onChange={setStarred}>
          <Icon name="star" className={isStarred ? 'icon-filled' : undefined} />
        </IconButton>
      </Toolbar>
    </div>
  )
}
