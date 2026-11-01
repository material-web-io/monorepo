import { Icon, IconButton, Tooltip, TooltipTrigger } from '@material-web/react'
import { Heading } from 'react-aria-components'

export default function Width() {
  return (
    <>
      <TooltipTrigger>
        <IconButton aria-label="Grant value">
          <Icon name="info" />
        </IconButton>
        <Tooltip className="max-w-80">
          Grant value is calculated using the closing stock price from the day before the grant
          date.
        </Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Favorite">
          <Icon name="star" />
        </IconButton>
        <Tooltip variant="rich" className="max-w-50">
          <Heading>Favorite</Heading>
          Find this later in your favorites.
        </Tooltip>
      </TooltipTrigger>
    </>
  )
}
