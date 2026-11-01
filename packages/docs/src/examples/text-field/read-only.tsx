import { TextField } from '@material-web/react'

export default function ReadOnlyAndDisabled() {
  return (
    <>
      <TextField
        label="Order number"
        description="Read-only"
        defaultValue="CA-2026-10-0417"
        isReadOnly
        className="w-64"
      />
      <TextField
        variant="outlined"
        label="Coupon"
        description="Not available for this order"
        defaultValue="SPRING"
        isDisabled
        className="w-64"
      />
    </>
  )
}
