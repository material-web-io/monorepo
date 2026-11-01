import { Button, Icon } from '@material-web/react'

export default function Basic() {
  return (
    <>
      <Button variant="text">Cancel</Button>
      <Button>
        <Icon name="check" />
        Save
      </Button>
    </>
  )
}
