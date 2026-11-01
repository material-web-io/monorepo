import { Button, Icon } from '@material-web/react'
import { useState } from 'react'

export default function Toggle() {
  const [isSaved, setSaved] = useState(false)
  return (
    <>
      <Button variant="tonal" isSelectable isSelected={isSaved} onChange={setSaved}>
        <Icon name="bookmark" className={isSaved ? 'icon-filled' : undefined} />
        {isSaved ? 'Saved' : 'Save'}
      </Button>
      <Button variant="outlined" isSelectable defaultSelected>
        Following
      </Button>
      <Button variant="filled" shape="square" isSelectable>
        Square
      </Button>
    </>
  )
}
