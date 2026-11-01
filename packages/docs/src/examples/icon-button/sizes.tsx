import { Icon, IconButton } from '@material-web/react'

const sizes = ['xs', 's', 'm', 'l', 'xl'] as const

export default function Sizes() {
  return (
    <>
      {sizes.map((size) => (
        <IconButton key={size} variant="tonal" size={size} aria-label={`Add, ${size}`}>
          <Icon name="add" />
        </IconButton>
      ))}
    </>
  )
}
