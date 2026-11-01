import { Button, Icon, IconButton, PreviewTrigger, TooltipPopover } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function RichActions() {
  return (
    <>
      <PreviewTrigger>
        <IconButton aria-label="Add others">
          <Icon name="person_add" />
        </IconButton>
        <TooltipPopover>
          <Heading>Add others</Heading>
          <Text>Share this collection with friends and family.</Text>
          <Button variant="text">Learn more</Button>
          <Button variant="text">Share</Button>
        </TooltipPopover>
      </PreviewTrigger>
      <IconButton aria-label="Next">
        <Icon name="arrow_forward" className="rtl:icon-mirrored" />
      </IconButton>
    </>
  )
}
