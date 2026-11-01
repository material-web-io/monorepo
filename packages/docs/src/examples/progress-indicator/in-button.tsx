import { Button, CircularProgressIndicator } from '@material-web/react'

export default function InButton() {
  return (
    <>
      <Button>
        <span aria-hidden className="flex">
          <CircularProgressIndicator
            aria-label="Saving"
            isIndeterminate
            size={24}
            showTrack={false}
            className="text-current"
          />
        </span>
        Saving
      </Button>
      <Button variant="outlined">
        <span aria-hidden className="flex">
          <CircularProgressIndicator
            aria-label="Checking for updates"
            isIndeterminate
            size={24}
            showTrack={false}
            className="text-current"
          />
        </span>
        Checking for updates
      </Button>
    </>
  )
}
