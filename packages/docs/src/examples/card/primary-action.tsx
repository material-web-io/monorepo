import { Button, Card, Ripple } from '@material-web/react'

const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140"><rect width="320" height="140" fill="#E8DEF8"/><path d="M0 120 90 60 150 100 200 75 320 125V140H0Z" fill="#6750A4" opacity=".6"/><circle cx="250" cy="40" r="20" fill="#6750A4"/></svg>',
)}`

export default function PrimaryAction() {
  return (
    <Card variant="outlined" className="w-80">
      <a
        href="#primary-action"
        className="relative focus-ring-inset flex flex-col text-on-surface no-underline outline-none"
      >
        <Ripple />
        <img src={cover} alt="" className="h-35 w-full object-cover" />
        <div className="p-space-200">
          <div className="text-title-md">Eye Rhymes</div>
          <div className="text-on-surface-variant">Glass & Grace</div>
        </div>
      </a>
      <div className="flex justify-end p-space-200 pt-0">
        <Button variant="text">Share</Button>
      </div>
    </Card>
  )
}
