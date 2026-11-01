import { Icon, IconButton } from '@material-web/react'
import { useState } from 'react'

export default function Toggle() {
  const [isSaved, setSaved] = useState(true)
  return (
    <>
      <IconButton
        variant="filled"
        aria-label="Bookmark"
        isSelectable
        isSelected={isSaved}
        onChange={setSaved}
      >
        <Icon name="bookmark" className={isSaved ? 'icon-filled' : undefined} />
      </IconButton>
      <IconButton variant="tonal" aria-label="Favorite" isSelectable defaultSelected>
        {({ isSelected }) => (
          <Icon name="favorite" className={isSelected ? 'icon-filled' : undefined} />
        )}
      </IconButton>
      <IconButton variant="outlined" aria-label="Pin" isSelectable>
        {({ isSelected }) => (
          <Icon name="keep" className={isSelected ? 'icon-filled' : undefined} />
        )}
      </IconButton>
      <IconButton variant="standard" shape="square" aria-label="Star" isSelectable>
        {({ isSelected }) => (
          <Icon name="star" className={isSelected ? 'icon-filled' : undefined} />
        )}
      </IconButton>
      <IconButton variant="outlined" aria-label="Like" isSelectable isSelected isDisabled>
        <Icon name="thumb_up" className="icon-filled" />
      </IconButton>
    </>
  )
}
