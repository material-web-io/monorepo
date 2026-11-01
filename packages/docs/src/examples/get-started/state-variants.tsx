import { Button } from '@material-web/react'

export default function StateVariants() {
  return (
    <>
      <Button className="hover:bg-tertiary hover:text-on-tertiary">hover:</Button>
      <Button className="pressed:bg-tertiary pressed:text-on-tertiary">pressed:</Button>
      <Button isSelectable className="selected:bg-tertiary selected:text-on-tertiary">
        selected:
      </Button>
    </>
  )
}
