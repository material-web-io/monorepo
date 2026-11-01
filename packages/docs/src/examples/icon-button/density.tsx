import { Icon, IconButton } from '@material-web/react'

const densities = ['', 'density-1', 'density-2', 'density-3']

export default function Density() {
  return (
    <>
      {densities.map((density) => (
        <IconButton
          key={density}
          variant="tonal"
          className={density}
          aria-label={density ? `Edit, ${density}` : 'Edit'}
        >
          <Icon name="edit" />
        </IconButton>
      ))}
    </>
  )
}
