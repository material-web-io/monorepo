import { CircularProgressIndicator } from '@material-web/react'

export default function CircularCustomScale() {
  return (
    <>
      <CircularProgressIndicator aria-label="Setting up, step 2 of 5" value={2} maxValue={5} />
      <CircularProgressIndicator
        aria-label="Preheating the oven"
        value={110}
        minValue={20}
        maxValue={200}
      />
    </>
  )
}
