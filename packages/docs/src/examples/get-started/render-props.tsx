import { Icon, IconButton } from '@material-web/react'
import { useState } from 'react'

export default function RenderProps() {
  const [isFavorite, setFavorite] = useState(false)
  return (
    <IconButton aria-label="Favorite" isSelectable isSelected={isFavorite} onChange={setFavorite}>
      {({ isSelected, isHovered }) => (
        <Icon name="favorite" className={isSelected || isHovered ? 'icon-filled' : undefined} />
      )}
    </IconButton>
  )
}
