/**
 * A ripple as it spreads, which it only does under a press: a button with the press circle
 * part way across it, grown from where a finger is on it.
 */
export default function RippleThumbnail() {
  return (
    <div className="relative shrink-0 text-on-primary">
      <div className="relative grid h-24 w-60 place-items-center overflow-hidden rounded-shape-full bg-primary text-headline-sm">
        Pressed
        <span className="absolute -end-13 -top-5 size-52 rounded-full bg-current opacity-state-pressed" />
      </div>
      <span className="absolute end-7 -bottom-3 box-border size-12 rounded-full border-2 border-current bg-on-primary/32" />
    </div>
  )
}
