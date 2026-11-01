import { Icon, IconButton } from '@material-web/react'
import { useState } from 'react'

export default function ToggleLoading() {
  const [isFavorite, setFavorite] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const favorite = async (isSelected: boolean) => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setFavorite(isSelected)
    setSaving(false)
  }
  return (
    <IconButton
      variant="filled"
      size="m"
      aria-label="Favorite"
      isSelectable
      isSelected={isFavorite}
      isPending={isSaving}
      onChange={favorite}
    >
      <Icon name="favorite" className={isFavorite ? 'icon-filled' : undefined} />
    </IconButton>
  )
}
