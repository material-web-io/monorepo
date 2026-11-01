import { Button, Icon } from '@material-web/react'

export default function WithIcon() {
  return (
    <>
      <Button>
        <Icon name="add" />
        Create
      </Button>
      <Button variant="tonal" size="m">
        <Icon name="edit" />
        Edit
      </Button>
      <Button variant="outlined">
        Send
        <Icon name="send" className="rtl:icon-mirrored" />
      </Button>
    </>
  )
}
