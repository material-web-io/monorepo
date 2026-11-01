import { Card } from '@material-web/react'

const cover = (fill: string, ink: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120"><rect width="240" height="120" fill="${fill}"/><circle cx="180" cy="40" r="20" fill="${ink}"/></svg>`,
  )}`

const albums = [
  { title: 'Eye Rhymes', artist: 'Glass & Grace', cover: cover('#E8DEF8', '#6750A4') },
  { title: 'Warped Speed', artist: 'Trapezoid', cover: cover('#FFD8E4', '#7D5260') },
  { title: 'Personal Voice', artist: 'Decorations', cover: cover('#FFD8E4', '#7D5260') },
  { title: 'NBR', artist: '21st Century Strangers', cover: cover('#E8DEF8', '#6750A4') },
]

export default function Collection() {
  return (
    <div className="grid w-full max-w-120 grid-cols-2 gap-space-100">
      {albums.map((album) => (
        <Card key={album.title} variant="filled">
          <img src={album.cover} alt="" className="h-30 w-full object-cover" />
          <div className="p-space-200">
            <div className="text-title-md">{album.title}</div>
            <div className="text-on-surface-variant">{album.artist}</div>
          </div>
        </Card>
      ))}
    </div>
  )
}
