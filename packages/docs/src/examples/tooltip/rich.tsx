import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function Rich() {
  return (
    <TooltipTrigger>
      <IconButton aria-label="Favorite">
        <Icon name="star" />
      </IconButton>
      <Tooltip variant="rich">
        <Heading>Favorite</Heading>
        Find this later in your favorites.
      </Tooltip>
    </TooltipTrigger>
  )
}
