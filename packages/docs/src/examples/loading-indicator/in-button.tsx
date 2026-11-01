import { Button, LoadingIndicator } from '@material-web/react'

export default function InButton() {
  return (
    <>
      <Button>
        <span aria-hidden className="flex">
          <LoadingIndicator aria-label="Checking for updates" size={24} className="text-current" />
        </span>
        Checking for updates
      </Button>
      <Button variant="tonal">
        <span aria-hidden className="flex">
          <LoadingIndicator aria-label="Validating" size={24} className="text-current" />
        </span>
        Validating
      </Button>
      <Button variant="outlined">
        <span aria-hidden className="flex">
          <LoadingIndicator aria-label="Saving" size={24} className="text-current" />
        </span>
        Saving
      </Button>
    </>
  )
}
