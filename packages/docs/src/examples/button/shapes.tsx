import { Button } from '@material-web/react'

export default function Shapes() {
  return (
    <>
      <Button shape="round">Round</Button>
      <Button shape="square">Square</Button>
      <Button shape="round" hasShapeMorph>
        Round, morphs
      </Button>
      <Button shape="square" hasShapeMorph>
        Square, morphs
      </Button>
    </>
  )
}
