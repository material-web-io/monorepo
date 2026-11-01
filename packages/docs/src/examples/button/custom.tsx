import { Button, Icon } from '@material-web/react'

export default function Custom() {
  return (
    <>
      <Button className="density-2">Compact</Button>
      <Button variant="outlined" className="hover:bg-primary hover:text-on-primary">
        Filled on hover
      </Button>
      <Button variant="tonal">
        {({ isHovered }) => (
          <>
            <Icon name="favorite" className={isHovered ? 'icon-filled' : undefined} />
            Favorite
          </>
        )}
      </Button>
    </>
  )
}
