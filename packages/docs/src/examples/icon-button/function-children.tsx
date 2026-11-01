import { Icon, IconButton } from '@material-web/react'
import { useState } from 'react'

export default function FunctionChildren() {
  const [isFavorite, setFavorite] = useState(false)
  return (
    <IconButton
      size="m"
      aria-label="Favorite"
      isSelectable
      isSelected={isFavorite}
      onChange={setFavorite}
    >
      {({ isSelected, isHovered }) => (
        <Icon name="favorite" className={isSelected || isHovered ? 'icon-filled' : undefined} />
      )}
    </IconButton>
  )
}
