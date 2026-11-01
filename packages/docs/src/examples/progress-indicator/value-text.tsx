import { CircularProgressIndicator } from '@material-web/react'

export default function ValueText() {
  return (
    <>
      <CircularProgressIndicator aria-label="Storage used" size={96} value={72}>
        {({ valueText }) => (
          <span className="absolute inset-0 grid place-items-center text-label-lg">
            {valueText}
          </span>
        )}
      </CircularProgressIndicator>
      <CircularProgressIndicator
        aria-label="Uploading photos"
        size={96}
        value={3}
        maxValue={8}
        valueLabel="3 of 8"
      >
        {({ valueText }) => (
          <span className="absolute inset-0 grid place-items-center text-label-lg">
            {valueText}
          </span>
        )}
      </CircularProgressIndicator>
    </>
  )
}
