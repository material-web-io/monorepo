import { Button } from '@material-web/react'
import type { ComponentProps } from 'react'

function Plus(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export default function OtherLibrary() {
  return (
    <Button>
      <Plus className="size-5" />
      Create
    </Button>
  )
}
