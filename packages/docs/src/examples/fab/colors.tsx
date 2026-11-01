import { Fab, Icon } from '@material-web/react'

const colors = [
  'primary-container',
  'secondary-container',
  'tertiary-container',
  'primary',
  'secondary',
  'tertiary',
] as const

export default function Colors() {
  return (
    <>
      {colors.map((color) => (
        <Fab key={color} color={color} aria-label={`Create, ${color}`}>
          <Icon name="add" />
        </Fab>
      ))}
    </>
  )
}
