import { Fab, Icon } from '@material-web/react'

export default function Sizes() {
  return (
    <>
      <Fab size="baseline" aria-label="Create, baseline">
        <Icon name="add" />
      </Fab>
      <Fab size="medium" aria-label="Create, medium">
        <Icon name="add" />
      </Fab>
      <Fab size="large" aria-label="Create, large">
        <Icon name="add" />
      </Fab>
    </>
  )
}
