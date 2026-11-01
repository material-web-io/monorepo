import { Card } from '@material-web/react'

const cover = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><rect width="320" height="180" fill="#FFD8E4"/><path d="M0 150 90 80 150 130 200 100 320 160V180H0Z" fill="#7D5260" opacity=".6"/><circle cx="250" cy="50" r="22" fill="#7D5260"/></svg>',
)}`

export default function Media() {
  return (
    <Card variant="filled" className="w-80">
      <img src={cover} alt="" className="h-45 w-full object-cover" />
      <div className="p-space-200">
        <div className="text-title-md">Warped Speed</div>
        <div className="text-on-surface-variant">Recorded over one winter in a lighthouse.</div>
      </div>
    </Card>
  )
}
