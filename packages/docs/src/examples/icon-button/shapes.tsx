import { Icon, IconButton } from '@material-web/react'

export default function Shapes() {
  return (
    <>
      <IconButton variant="filled" size="m" shape="round" aria-label="Round">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="filled" size="m" shape="square" aria-label="Square">
        <Icon name="edit" />
      </IconButton>
      <IconButton variant="filled" size="m" shape="round" hasShapeMorph aria-label="Round, morphs">
        <Icon name="edit" />
      </IconButton>
      <IconButton
        variant="filled"
        size="m"
        shape="square"
        hasShapeMorph
        aria-label="Square, morphs"
      >
        <Icon name="edit" />
      </IconButton>
    </>
  )
}
