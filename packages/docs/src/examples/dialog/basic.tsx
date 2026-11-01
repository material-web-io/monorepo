import { Button, Dialog, DialogTrigger } from '@material-web/react'
import { Heading, Text } from 'react-aria-components'

export default function Basic() {
  return (
    <DialogTrigger>
      <Button variant="tonal">Use location</Button>
      <Dialog>
        <Heading
          slot="title"
          className="m-0 px-space-300 pb-space-200 text-headline-sm text-on-surface"
        >
          Use location service?
        </Heading>
        <Text
          slot="description"
          elementType="p"
          className="m-0 min-h-0 grow overflow-y-auto px-space-300 pb-space-100"
        >
          Let this service help other apps determine your location. This means sharing anonymous
          location data, even when no apps are running.
        </Text>
        <div className="flex shrink-0 flex-wrap-reverse justify-end gap-space-100 px-space-300 pt-space-200">
          <Button variant="text" slot="close">
            Disagree
          </Button>
          <Button variant="text" slot="close">
            Agree
          </Button>
        </div>
      </Dialog>
    </DialogTrigger>
  )
}
