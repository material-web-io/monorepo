import { Checkbox } from '@material-web/react'

export default function WithLabel() {
  return (
    <>
      <Checkbox defaultSelected className="text-body-lg">
        Remember me
      </Checkbox>
      <Checkbox aria-label="Select all messages" />
    </>
  )
}
