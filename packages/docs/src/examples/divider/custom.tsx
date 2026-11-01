import { Card, Divider } from '@material-web/react'

export default function Custom() {
  return (
    <Card variant="outlined" className="w-80 p-space-200 text-body-lg">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <span>$48.00</span>
      </div>
      <div className="flex justify-between">
        <span>Shipping</span>
        <span>$4.00</span>
      </div>
      <Divider className="my-space-150 border-primary" />
      <div className="flex justify-between text-title-md">
        <span>Total</span>
        <span>$52.00</span>
      </div>
    </Card>
  )
}
